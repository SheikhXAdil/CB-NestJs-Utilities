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
import { FilesService } from 'src/files/services/files/files.service';
import {
  CreateVehicleServiceDto,
  UpdateVehicleServiceDto,
  VehicleServiceFilesUploadDto,
  VehicleServiceSortKeys,
} from 'src/vehicle-services/dto/vehicle-service.dto';
import { Service } from 'src/vehicle-services/entities/vehicle-service.entity';
import { VehiclesService } from 'src/vehicles/services/vehicles/vehicles.service';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class VehicleServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly vehicleServicesRepository: Repository<Service>,
    private readonly filesService: FilesService,
    private readonly vehiclesService: VehiclesService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey: VehicleServiceSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.vehicleServicesRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.vehicle', 'vehicle')
      .where('service.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const services = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(services);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Service>,
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
        dateCondition.push(`EXTRACT(MONTH FROM service.startDate) = :month`);
        dateCondition.push(`EXTRACT(MONTH FROM service.endDate) = :month`);
        parameters['month'] = month;
      }

      // Add text search filters
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `vehicle.name ILIKE :${paramName} OR service.status ILIKE :${paramName} OR CAST(service.totalAmount AS TEXT) ILIKE :${paramName}`,
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
    query: SelectQueryBuilder<Service>,
    sortOptions: SortOptions<VehicleServiceSortKeys>,
  ) {
    if (sortOptions.sortKey === VehicleServiceSortKeys.vehicleName) {
      query = query.orderBy(`vehicle.name`, sortOptions.sortOrder);
    } else {
      query = query.orderBy(
        `service.${sortOptions.sortKey}`,
        sortOptions.sortOrder,
        sortOptions.sortOrder === 'ASC' ? 'NULLS FIRST' : 'NULLS LAST',
      );
    }

    return query;
  }

  private mapDataForFindAll(data: Pagination<Service>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const service = {
        id: e.id,
        totalAmount: e.totalAmount,
        status: e.status,
        attachment: e.attachment,
        startDate: moment(e.startDate).format(dateResMomentFormat),
        endDate: moment(e.endDate).format(dateResMomentFormat),
        vehicleName: e.vehicle ? e.vehicle.name : '-',
      };
      return service;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Service>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const service = await this.vehicleServicesRepository.findOne({
      where: options,
      relations,
    });

    if (!service && throwException) {
      throw new NotFoundException(`No such Service found!`);
    }

    return service;
  }

  async create(
    createVehicleServiceDto: CreateVehicleServiceDto,
    files: VehicleServiceFilesUploadDto,
  ) {
    const service = this.vehicleServicesRepository.create(
      createVehicleServiceDto,
    );

    const vehicle = await this.vehiclesService.findOne({
      id: createVehicleServiceDto.vehicleId,
    });
    service.vehicle = vehicle;

    const savedService = await this.vehicleServicesRepository.save(service);

    if (files.attachment.length > 0) {
      savedService.attachment = await this.uploadAttachment(
        savedService.id,
        files.attachment[0],
      );
      return await this.vehicleServicesRepository.save(savedService);
    } else {
      return savedService;
    }
  }

  async update(
    id: string,
    updateVehicleServiceDto: UpdateVehicleServiceDto,
    files: VehicleServiceFilesUploadDto,
  ) {
    let service: any = await this.findOne({ id });

    service = { ...service, ...updateVehicleServiceDto };

    if (files.attachment.length > 0) {
      service.attachment = await this.updateAttachment(
        service,
        files.attachment[0],
      );
    }

    return await this.vehicleServicesRepository.save(service);
  }

  async remove(id: string) {
    const service = await this.findOne({ id });

    service.deletedAt = moment.tz();
    service.isDeleted = true;

    return await this.vehicleServicesRepository.save(service);
  }

  async uploadAttachment(serviceId: string, attachment: MemoryStorageFile) {
    const hash = createHash('md5').update(serviceId).digest('hex');
    const imageType: string = attachment.mimetype.split('/').pop();
    const filePath = `vehicleServices/${serviceId}/attachment/${hash}${moment().unix()}.${imageType}`;

    try {
      const url = await this.filesService.upload(
        attachment.buffer,
        filePath,
        attachment.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateAttachment(service: Service, attachment: MemoryStorageFile) {
    let deleteFromStorage = false;

    if (!service.attachment) {
      return this.uploadAttachment(service.id, attachment);
    }

    const start = service.attachment.search('com') + 4;
    const originalFilePath = service.attachment.slice(start);

    const hash = createHash('md5').update(service.id).digest('hex');
    const imageType: string = attachment.mimetype.split('/').pop();
    const filePath = `vehicleServices/${service.id}/attachment/${hash}${moment().unix()}.${imageType}`;

    if (filePath !== originalFilePath) {
      deleteFromStorage = true;
    }

    try {
      if (deleteFromStorage) {
        await this.filesService.delete(originalFilePath);
      }
      const url = await this.filesService.upload(
        attachment.buffer,
        filePath,
        attachment.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteAttachment(attachment: string) {
    const start = attachment.search('com') + 4;
    const attachmentFilePath = attachment.slice(start);

    return await this.filesService.delete(attachmentFilePath);
  }

  async getTotalServiceExpenses() {
    const data = await this.vehicleServicesRepository
      .createQueryBuilder('service')
      .select('SUM(service.totalAmount)', 'totalIncome')
      .getRawOne();

    return data.totalIncome;
  }

  async getMonthlyServiceExpenseReport(year: number) {
    const data = await this.vehicleServicesRepository
      .createQueryBuilder('service')
      .select([
        "to_char(service.startDate, 'FMMonth') AS month", // Fetch full month names
        'SUM(service.totalAmount) AS expense',
      ])
      .where('EXTRACT(YEAR FROM service.startDate) = :year', { year })
      .groupBy("to_char(service.startDate, 'FMMonth')")
      .addGroupBy('service.startDate')
      .orderBy('EXTRACT(MONTH FROM service.startDate)', 'ASC')
      .getRawMany();

    const monthlyReport = {};

    for (const obj of data) {
      monthlyReport[obj.month] = obj.expense;
    }

    return monthlyReport;
  }

  private mapDataForExport(data: Service[]) {
    const returnData = data.map((e) => {
      const service = {
        id: e.id,
        totalAmount: e.totalAmount,
        status: e.status,
        attachment: e.attachment,
        startDate: moment(e.startDate).format(dateResMomentFormat),
        endDate: moment(e.endDate).format(dateResMomentFormat),
        vehicleName: e.vehicle ? e.vehicle.name : '-',
      };
      return service;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey: VehicleServiceSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.vehicleServicesRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.vehicle', 'vehicle')
      .where('service.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const services = await query.getMany();
    const mappedServices = this.mapDataForExport(services);

    return mappedServices;
  }

  async copyPrint(
    sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey: VehicleServiceSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const services = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Services\n\nVehicle\tStart Date\tEnd Date\tTotal Amount\tStatus\n`;

    const data = services
      .map((e) => {
        const vehicle = e.vehicleName || '-';
        const startDate = e.startDate || '-';
        const endDate = e.endDate || '-';
        const totalAmount = e.totalAmount === null ? e.totalAmount : '-';
        const status = e.status || '-';

        return `${vehicle}\t${startDate}\t${endDate}\t${totalAmount}\t${status}`;
      })
      .join('\n'); // Join rows with newline for proper formatting

    const exportData = `${header}${data}`;
    const rowCount = services.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey: VehicleServiceSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const services = await this.getDataForExport(sortOptions, search);

    const mappedServices = services.map((e) => {
      const obj = {
        Vehicle: e.vehicleName,
        'Start Date': e.startDate,
        'End Date': e.endDate,
        'Total Amount': e.totalAmount,
        Status: e.status,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedServices);
  }

  async generateExcelFile(
    sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey: VehicleServiceSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const services = await this.getDataForExport(sortOptions, search);

    const mappedServices = services.map((e) => {
      const obj = {
        Vehicle: e.vehicleName,
        'Start Date': e.startDate,
        'End Date': e.endDate,
        'Total Amount': e.totalAmount,
        Status: e.status,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedServices, 'Service');
  }

  async generatePdf(
    sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey: VehicleServiceSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const services = await this.getDataForExport(sortOptions, search);

    const mappedServices = services.map((e) => {
      const obj = {
        Vehicle: e.vehicleName,
        'Start Date': e.startDate,
        'End Date': e.endDate,
        'Total Amount': e.totalAmount,
        Status: e.status,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedServices,
      'Smart Fleet SaaS - Service',
    );
  }
}
