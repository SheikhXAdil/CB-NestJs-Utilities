import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import * as moment from 'moment-timezone';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { SortOptions } from 'src/common/classes/Sorting';
import { dateResMomentFormat } from 'src/common/utilities/formats';
import { ExportService } from 'src/export/export.service';
import {
  CreateExpenseDto,
  ExpenseFilesUploadDto,
  ExpenseSortKeys,
  UpdateExpenseDto,
} from 'src/expenses/dto/expenses.dto';
import { Expense } from 'src/expenses/entities/expense.entity';
import { FilesService } from 'src/files/services/files/files.service';
import { VehiclesService } from 'src/vehicles/services/vehicles/vehicles.service';
import {
  Brackets,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    private readonly filesService: FilesService,
    private readonly vehiclesService: VehiclesService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey: ExpenseSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.vehicle', 'vehicle')
      .where('expense.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const expenses = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(expenses);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Expense>,
    search: string,
  ) {
    if (search) {
      const trimmedSearch = search.toLowerCase().trim().replace(/\s+/g, ' '); // Normalize spaces
      const dateMatch = trimmedSearch.match(
        /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i, // Match month and optionally day
      );
      const parameters = {};

      // Extract date components
      let month: number | null = null;

      if (dateMatch) {
        const monthString = dateMatch[1]; // Match group for the month

        const parsedDate = moment(`${monthString}`, 'MMM', true);

        if (parsedDate.isValid()) {
          month = parsedDate.month() + 1; // Moment months are 0-based
        }

        // Remove the date part from the search string for further processing
        search = trimmedSearch.replace(dateMatch[0], '').trim();
      }

      // Build the query dynamically
      const ilikeConditions = [];
      const dateCondition = [];
      const searchTerms = search.split(' ').filter((term) => term); // Split remaining terms and remove empty strings

      // Add date filter if a valid date was extracted
      if (month) {
        // Match the entire month
        dateCondition.push(`EXTRACT(MONTH FROM expense.date) = :month`);
        parameters['month'] = month;
      }

      // Add text search filters
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `vehicle.name ILIKE :${paramName} OR expense.title ILIKE :${paramName} OR expense.note ILIKE :${paramName} OR CAST(expense.amount AS TEXT) ILIKE :${paramName}`,
        );
        parameters[paramName] = `%${term}%`;
      });

      // Combine conditions with AND
      if (ilikeConditions.length > 0 || dateCondition.length > 0) {
        // Filter out empty strings to avoid syntax issues
        const combinedConditions = [
          ...dateCondition,
          ilikeConditions.length > 0 ? `(${ilikeConditions.join(' OR ')})` : '',
        ].filter((condition) => condition.trim() !== ''); // Remove empty strings

        if (combinedConditions.length > 0) {
          query.andWhere(`(${combinedConditions.join(' OR ')})`, parameters);
        }
      }
    }

    return query;
  }

  private applySortingQueryForFindAll(
    query: SelectQueryBuilder<Expense>,
    sortOptions: SortOptions<ExpenseSortKeys>,
  ) {
    if (sortOptions.sortKey === ExpenseSortKeys.vehicleName) {
      query = query.orderBy(
        `vehicle.name`,
        sortOptions.sortOrder,
        sortOptions.sortOrder === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST',
      );
    } else {
      query = query.orderBy(
        `expense.${sortOptions.sortKey}`,
        sortOptions.sortOrder,
      );
    }

    return query;
  }

  private mapDataForFindAll(data: Pagination<Expense>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const expense = {
        id: e.id,
        title: e.title,
        amount: e.amount,
        note: e.note,
        receipt: e.receipt,
        date: moment(e.date).format(dateResMomentFormat),
        vehicleName: e.vehicle ? e.vehicle.name : '-',
      };
      return expense;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Expense>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const expense = await this.expensesRepository.findOne({
      where: options,
      relations,
    });

    if (!expense && throwException) {
      throw new NotFoundException(`No such Expense found!`);
    }

    return expense;
  }

  async create(
    createExpenseDto: CreateExpenseDto,
    files: ExpenseFilesUploadDto,
  ) {
    const expense = this.expensesRepository.create(createExpenseDto);

    expense.date = moment.utc(createExpenseDto.date, 'DD/MM/YYYY');

    if (createExpenseDto.vehicleId) {
      const vehicle = await this.vehiclesService.findOne({
        id: createExpenseDto.vehicleId,
      });
      expense.vehicle = vehicle;
    }

    const savedExpense = await this.expensesRepository.save(expense);

    if (files.receipt.length > 0) {
      savedExpense.receipt = await this.uploadReceipt(
        savedExpense.id,
        files.receipt[0],
      );

      return await this.expensesRepository.save(savedExpense);
    } else {
      return savedExpense;
    }
  }

  async update(
    id: string,
    updateExpenseDto: UpdateExpenseDto,
    files: ExpenseFilesUploadDto,
  ) {
    let expense: any = await this.findOne({ id });

    expense = { ...expense, ...updateExpenseDto };

    if (updateExpenseDto.date) {
      expense.date = moment.utc(updateExpenseDto.date, 'DD/MM/YYYY');
    }

    if (files.receipt.length > 0) {
      expense.receipt = await this.updateReceipt(expense, files.receipt[0]);
    }

    return await this.expensesRepository.save(expense);
  }

  async remove(id: string) {
    const expense = await this.findOne({ id });

    expense.deletedAt = moment.tz();
    expense.isDeleted = true;

    return await this.expensesRepository.save(expense);
  }

  async uploadReceipt(expenseId: string, receipt: MemoryStorageFile) {
    const hash = createHash('md5').update(expenseId).digest('hex');
    const imageType: string = receipt.mimetype.split('/').pop();
    const filePath = `expenses/${expenseId}/receipt/${hash}${moment().unix()}.${imageType}`;

    try {
      const url = await this.filesService.upload(
        receipt.buffer,
        filePath,
        receipt.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateReceipt(expense: Expense, receipt: MemoryStorageFile) {
    let deleteFromStorage = false;

    if (!expense.receipt) {
      return this.uploadReceipt(expense.id, receipt);
    }

    const start = expense.receipt.search('com') + 4;
    const originalFilePath = expense.receipt.slice(start);

    const hash = createHash('md5').update(expense.id).digest('hex');
    const imageType: string = receipt.mimetype.split('/').pop();
    const filePath = `expenses/${expense.id}/receipt/${hash}${moment().unix()}.${imageType}`;

    if (filePath !== originalFilePath) {
      deleteFromStorage = true;
    }

    try {
      if (deleteFromStorage) {
        await this.filesService.delete(originalFilePath);
      }
      const url = await this.filesService.upload(
        receipt.buffer,
        filePath,
        receipt.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteReceipt(receipt: string) {
    const start = receipt.search('com') + 4;
    const receiptFilePath = receipt.slice(start);

    return await this.filesService.delete(receiptFilePath);
  }

  async getTotalExpenseExpenses() {
    const data = await this.expensesRepository
      .createQueryBuilder('expense')
      .select('SUM(expense.amount)', 'totalIncome')
      .getRawOne();

    return data.totalIncome;
  }

  async getMonthlyExpensesExpenseReport(year: number) {
    const data = await this.expensesRepository
      .createQueryBuilder('expense')
      .select([
        "to_char(expense.date, 'FMMonth') AS month", // Fetch full month names
        'SUM(expense.amount) AS expense',
      ])
      .where('EXTRACT(YEAR FROM expense.date) = :year', { year })
      .groupBy("to_char(expense.date, 'FMMonth')")
      .addGroupBy('expense.date')
      .orderBy('EXTRACT(MONTH FROM expense.date)', 'ASC')
      .getRawMany();

    const monthlyReport = {};

    for (const obj of data) {
      monthlyReport[obj.month] = obj.expense;
    }

    return monthlyReport;
  }

  private mapDataForExport(data: Expense[]) {
    const returnData = data.map((e) => {
      const expense = {
        id: e.id,
        title: e.title,
        amount: e.amount,
        note: e.note,
        receipt: e.receipt,
        date: moment(e.date).format(dateResMomentFormat),
        vehicleName: e.vehicle ? e.vehicle.name : '-',
      };
      return expense;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey: ExpenseSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.vehicle', 'vehicle')
      .where('expense.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const expenses = await query.getMany();
    const mappedExpenses = this.mapDataForExport(expenses);

    return mappedExpenses;
  }

  async copyPrint(
    sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey: ExpenseSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const expenses = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Expenses\n\nTitle\tVehicle\tDate\tAmount\tNotes\n`;

    const data = expenses
      .map((e) => {
        const title = e.title || '-';
        const vehicle = e.vehicleName || '-';
        const date = e.date || '-';
        const amount = e.amount !== null ? e.amount.toLocaleString() : '-';
        const notes = e.note || '-';

        return `${title}\t${vehicle}\t${date}\t${amount}\t${notes}`;
      })
      .join('\n'); // Join rows with newline for proper formatting

    const exportData = `${header}${data}`;
    const rowCount = expenses.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey: ExpenseSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const expenses = await this.getDataForExport(sortOptions, search);

    const mappedExpenses = expenses.map((e) => {
      const obj = {
        Title: e.title,
        Vehicle: e.vehicleName,
        Date: e.date,
        Amount: e.amount,
        Notes: e.note,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedExpenses);
  }

  async generateExcelFile(
    sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey: ExpenseSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const expenses = await this.getDataForExport(sortOptions, search);

    const mappedExpenses = expenses.map((e) => {
      const obj = {
        Title: e.title,
        Vehicle: e.vehicleName,
        Date: e.date,
        Amount: e.amount,
        Notes: e.note,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedExpenses, 'Expense');
  }

  async generatePdf(
    sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey: ExpenseSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const expenses = await this.getDataForExport(sortOptions, search);

    const mappedExpenses = expenses.map((e) => {
      const obj = {
        Title: e.title,
        Vehicle: e.vehicleName,
        Date: e.date,
        Amount: e.amount,
        Notes: e.note,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedExpenses,
      'Smart Fleet SaaS - Expense',
    );
  }
}
