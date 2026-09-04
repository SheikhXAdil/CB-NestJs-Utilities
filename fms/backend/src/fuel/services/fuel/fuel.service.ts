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
import { dateTimeResMomentFormat } from 'src/common/utilities/formats';
import { ExportService } from 'src/export/export.service';
import { DriversService } from 'src/drivers/services/driver/drivers.service';
import { FilesService } from 'src/files/services/files/files.service';
import {
  CreateFuelDto,
  FuelFilesUploadDto,
  FuelSortKeys,
  UpdateFuelDto,
} from 'src/fuel/dto/fuel.dto';
import { Fuel } from 'src/fuel/entities/fuel.entity';
import { VehiclesService } from 'src/vehicles/services/vehicles/vehicles.service';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class FuelService {
  constructor(
    @InjectRepository(Fuel)
    private readonly fuelsRepository: Repository<Fuel>,
    private readonly filesService: FilesService,
    private readonly vehiclesService: VehiclesService,
    private readonly driversService: DriversService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<FuelSortKeys> = {
      sortKey: FuelSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.fuelsRepository
      .createQueryBuilder('fuel')
      .leftJoinAndSelect('fuel.vehicle', 'vehicle')
      .leftJoinAndSelect('fuel.driver', 'driver')
      .where('fuel.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const fuels = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(fuels);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Fuel>,
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
        dateCondition.push(`EXTRACT(MONTH FROM fuel.dateTime) = :month`);
        parameters['month'] = month;
      }

      // Add text search filters
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `vehicle.name ILIKE :${paramName} OR driver.name ILIKE :${paramName} OR fuel.fuelLocation ILIKE :${paramName} OR CAST(fuel.totalAmount AS TEXT) ILIKE :${paramName} OR CAST(fuel.totalQuantity AS TEXT) ILIKE :${paramName} OR CAST(fuel.meterReading AS TEXT) ILIKE :${paramName}`,
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
    query: SelectQueryBuilder<Fuel>,
    sortOptions: SortOptions<FuelSortKeys>,
  ) {
    if (sortOptions.sortKey === FuelSortKeys.vehicleName) {
      query = query.orderBy(`vehicle.name`, sortOptions.sortOrder);
    } else if (sortOptions.sortKey === FuelSortKeys.driverName) {
      query = query.orderBy(`driver.name`, sortOptions.sortOrder);
    } else {
      query = query.orderBy(
        `fuel.${sortOptions.sortKey}`,
        sortOptions.sortOrder,
      );
    }

    return query;
  }

  private mapDataForFindAll(data: Pagination<Fuel>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const fuel = {
        id: e.id,
        meterReading: e.meterReading,
        totalAmount: e.totalAmount,
        totalQuantity: e.totalQuantity,
        fuelLocation: e.fuelLocation,
        receipt: e.receipt,
        dateTime: moment(e.dateTime).format(dateTimeResMomentFormat),
        vehicleName: e.vehicle ? e.vehicle.name : '-',
        driverName: e.driver ? e.driver.name : '-',
      };
      return fuel;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Fuel>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const fuel = await this.fuelsRepository.findOne({
      where: options,
      relations,
    });

    if (!fuel && throwException) {
      throw new NotFoundException(`No such Fuel found!`);
    }

    return fuel;
  }

  async create(createFuelDto: CreateFuelDto, files: FuelFilesUploadDto) {
    const fuel = this.fuelsRepository.create(createFuelDto);

    fuel.dateTime = moment.utc(createFuelDto.dateTime, 'DD/MM/YYYY HH:mm');

    const vehicle = await this.vehiclesService.findOne({
      id: createFuelDto.vehicleId,
    });
    fuel.vehicle = vehicle;

    if (createFuelDto.driverId) {
      const driver = await this.driversService.findOne({
        id: createFuelDto.driverId,
      });
      fuel.driver = driver;
    }

    const savedFuel = await this.fuelsRepository.save(fuel);

    if (files.receipt.length > 0) {
      savedFuel.receipt = await this.uploadReceipt(
        savedFuel.id,
        files.receipt[0],
      );

      return await this.fuelsRepository.save(savedFuel);
    } else {
      return savedFuel;
    }
  }

  async update(
    id: string,
    updateFuelDto: UpdateFuelDto,
    files: FuelFilesUploadDto,
  ) {
    let fuel: any = await this.findOne({ id });

    fuel = { ...fuel, ...updateFuelDto };

    if (updateFuelDto.dateTime) {
      fuel.dateTime = moment.utc(updateFuelDto.dateTime, 'DD/MM/YYYY HH:mm');
    }

    if (files.receipt.length > 0) {
      fuel.receipt = await this.updateReceipt(fuel, files.receipt[0]);
    }

    return await this.fuelsRepository.save(fuel);
  }

  async remove(id: string) {
    const fuel = await this.findOne({ id });

    fuel.deletedAt = moment.tz();
    fuel.isDeleted = true;

    return await this.fuelsRepository.save(fuel);
  }

  async uploadReceipt(FuelId: string, receipt: MemoryStorageFile) {
    const hash = createHash('md5').update(FuelId).digest('hex');
    const imageType: string = receipt.mimetype.split('/').pop();
    const filePath = `fuels/${FuelId}/receipt/${hash}${moment().unix()}.${imageType}`;

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

  async updateReceipt(fuel: Fuel, receipt: MemoryStorageFile) {
    let deleteFromStorage = false;

    if (!fuel.receipt) {
      return this.uploadReceipt(fuel.id, receipt);
    }

    const start = fuel.receipt.search('com') + 4;
    const originalFilePath = fuel.receipt.slice(start);

    const hash = createHash('md5').update(fuel.id).digest('hex');
    const imageType: string = receipt.mimetype.split('/').pop();
    const filePath = `fuels/${fuel.id}/receipt/${hash}${moment().unix()}.${imageType}`;

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

  async getTotalFuelExpenses() {
    const data = await this.fuelsRepository
      .createQueryBuilder('fuel')
      .select('SUM(fuel.totalAmount)', 'totalIncome')
      .getRawOne();

    return data.totalIncome;
  }

  async getMonthlyFuelExpenseReport(year: number) {
    const data = await this.fuelsRepository
      .createQueryBuilder('fuel')
      .select([
        "to_char(fuel.dateTime, 'FMMonth') AS month", // Fetch full month names
        'SUM(fuel.totalAmount) AS expense',
      ])
      .where('EXTRACT(YEAR FROM fuel.dateTime) = :year', { year })
      .groupBy("to_char(fuel.dateTime, 'FMMonth')")
      .addGroupBy('fuel.dateTime')
      .orderBy('EXTRACT(MONTH FROM fuel.dateTime)', 'ASC')
      .getRawMany();

    const monthlyReport = {};

    for (const obj of data) {
      monthlyReport[obj.month] = obj.expense;
    }

    return monthlyReport;
  }

  private mapDataForExport(data: Fuel[]) {
    const returnData = data.map((e) => {
      const fuel = {
        id: e.id,
        meterReading: e.meterReading,
        totalAmount: e.totalAmount,
        totalQuantity: e.totalQuantity,
        fuelLocation: e.fuelLocation,
        receipt: e.receipt,
        dateTime: moment(e.dateTime).format(dateTimeResMomentFormat),
        vehicleName: e.vehicle ? e.vehicle.name : '-',
        driverName: e.driver ? e.driver.name : '-',
      };
      return fuel;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<FuelSortKeys> = {
      sortKey: FuelSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.fuelsRepository
      .createQueryBuilder('fuel')
      .leftJoinAndSelect('fuel.vehicle', 'vehicle')
      .leftJoinAndSelect('fuel.driver', 'driver')
      .where('fuel.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const fuels = await query.getMany();
    const mappedFuels = this.mapDataForExport(fuels);

    return mappedFuels;
  }

  async copyPrint(
    sortOptions: SortOptions<FuelSortKeys> = {
      sortKey: FuelSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const fuels = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Fuels\n\nVehicle\tDriver\tDuration\tQuantity\tTotal Amount\tMeter Reading\tFuel Location\n`;

    const data = fuels
      .map((e) => {
        const vehicle = e.vehicleName || '-';
        const driver = e.driverName || '-';
        const duration = e.dateTime || '-';
        const quantity = e.totalQuantity !== null ? e.totalQuantity : '-';
        const totalAmount = e.totalAmount !== null ? e.totalAmount : '-';
        const meterReading = e.meterReading !== null ? e.meterReading : '-';
        const fuelLocation = e.fuelLocation || '-';

        return `${vehicle}\t${driver}\t${duration}\t${quantity}\t${totalAmount}\t${meterReading}\t${fuelLocation}`;
      })
      .join('\n'); // Join rows with newline for proper formatting

    const exportData = `${header}${data}`;
    const rowCount = fuels.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<FuelSortKeys> = {
      sortKey: FuelSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const fuels = await this.getDataForExport(sortOptions, search);

    const mappedFuels = fuels.map((e) => {
      const obj = {
        Vehicle: e.vehicleName,
        Driver: e.driverName,
        Duration: e.dateTime,
        Quantity: e.totalQuantity,
        'Total Amount': e.totalAmount,
        'Meter Reading': e.meterReading,
        'Fuel Location': e.fuelLocation,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedFuels);
  }

  async generateExcelFile(
    sortOptions: SortOptions<FuelSortKeys> = {
      sortKey: FuelSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const fuels = await this.getDataForExport(sortOptions, search);

    const mappedFuels = fuels.map((e) => {
      const obj = {
        Vehicle: e.vehicleName,
        Driver: e.driverName,
        Duration: e.dateTime,
        Quantity: e.totalQuantity,
        'Total Amount': e.totalAmount,
        'Meter Reading': e.meterReading,
        'Fuel Location': e.fuelLocation,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedFuels, 'Fuel');
  }

  async generatePdf(
    sortOptions: SortOptions<FuelSortKeys> = {
      sortKey: FuelSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const fuels = await this.getDataForExport(sortOptions, search);

    const mappedFuels = fuels.map((e) => {
      const obj = {
        Vehicle: e.vehicleName,
        Driver: e.driverName,
        Duration: e.dateTime,
        Quantity: e.totalQuantity,
        'Total Amount': e.totalAmount,
        'Meter Reading': e.meterReading,
        'Fuel Location': e.fuelLocation,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedFuels,
      'Smart Fleet SaaS - Fuel',
    );
  }
}
