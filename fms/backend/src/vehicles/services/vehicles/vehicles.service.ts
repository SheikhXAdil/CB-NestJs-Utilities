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
import { VehicleTypeService } from 'src/system-setup/services/vehicle-type/vehicle-type.service';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleFilesUploadDto,
  VehicleSortKeys,
} from 'src/vehicles/dto/vehicle.dto';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
    private readonly filesService: FilesService,
    private readonly vehicleTypeService: VehicleTypeService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey: VehicleSortKeys.vehicleId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.vehiclesRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const vehicles = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(vehicles);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Vehicle>,
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
        dateCondition.push(
          `EXTRACT(MONTH FROM vehicle.registrationExpiryDate) = :month`,
        );
        parameters['month'] = month;
      }

      // Add text search filters
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `vehicle.name ILIKE :${paramName} OR vehicle.type ILIKE :${paramName} OR vehicle.model ILIKE :${paramName} OR vehicle.engineType ILIKE :${paramName} OR vehicle.licensePlate ILIKE :${paramName}`,
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
    query: SelectQueryBuilder<Vehicle>,
    sortOptions: SortOptions<VehicleSortKeys>,
  ) {
    query = query.orderBy(
      `vehicle.${sortOptions.sortKey}`,
      sortOptions.sortOrder,
    );
    return query;
  }

  private mapDataForFindAll(data: Pagination<Vehicle>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const vehicle = {
        id: e.id,
        vehicleId: e.vehicleId,
        name: e.name,
        type: e.type,
        model: e.model,
        licensePlate: e.licensePlate,
        engineType: e.engineType,
        registrationExpiryDate: moment
          .utc(e.registrationExpiryDate)
          .format(dateResMomentFormat),
      };
      return vehicle;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Vehicle>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const vehicle = await this.vehiclesRepository.findOne({
      where: options,
      relations,
    });

    if (!vehicle && throwException) {
      throw new NotFoundException(`No such Vehicle found!`);
    }

    return vehicle;
  }

  async create(
    createVehicleDto: CreateVehicleDto,
    files: VehicleFilesUploadDto,
  ) {
    const vehicle = this.vehiclesRepository.create(createVehicleDto);

    vehicle.registrationExpiryDate = moment.utc(
      createVehicleDto.registrationExpiryDate,
      'DD/MM/YYYY',
    );

    // Throws not found exception
    await this.vehicleTypeService.findOne({
      type: createVehicleDto.type,
    });

    vehicle.vehicleId = await this.getVehicleId();

    const savedVehicle = await this.vehiclesRepository.save(vehicle);

    savedVehicle.document = await this.uploadDocument(
      savedVehicle.id,
      files.document[0],
    );

    return await this.vehiclesRepository.save(savedVehicle);
  }

  async update(
    id: string,
    updateVehicleDto: UpdateVehicleDto,
    files: VehicleFilesUploadDto,
  ) {
    let vehicle: any = await this.findOne({ id });

    vehicle = { ...vehicle, ...updateVehicleDto };

    if (updateVehicleDto.type) {
      // Throws not found exception
      await this.vehicleTypeService.findOne({
        type: updateVehicleDto.type,
      });
    }

    if (updateVehicleDto.registrationExpiryDate) {
      vehicle.registrationExpiryDate = moment.utc(
        updateVehicleDto.registrationExpiryDate,
        'DD/MM/YYYY',
      );
    }

    if (files.document) {
      vehicle.document = await this.updateDocument(vehicle, files.document[0]);
    }

    return await this.vehiclesRepository.save(vehicle);
  }

  async remove(id: string) {
    const vehicle = await this.findOne({ id });

    vehicle.deletedAt = moment.tz();
    vehicle.isDeleted = true;

    return await this.vehiclesRepository.save(vehicle);
  }

  async uploadDocument(vehicleId: string, document: MemoryStorageFile) {
    const hash = createHash('md5').update(vehicleId).digest('hex');
    const imageType: string = document.mimetype.split('/').pop();
    const filePath = `vehicles/${vehicleId}/document/${hash}${moment().unix()}.${imageType}`;

    try {
      const url = await this.filesService.upload(
        document.buffer,
        filePath,
        document.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateDocument(vehicle: Vehicle, document: MemoryStorageFile) {
    let deleteFromStorage = false;

    if (!vehicle.document) {
      return this.uploadDocument(vehicle.id, document);
    }

    const start = vehicle.document.search('com') + 4;
    const originalFilePath = vehicle.document.slice(start);

    const hash = createHash('md5').update(vehicle.id).digest('hex');
    const imageType: string = document.mimetype.split('/').pop();
    const filePath = `vehicles/${vehicle.id}/document/${hash}${moment().unix()}.${imageType}`;

    if (filePath !== originalFilePath) {
      deleteFromStorage = true;
    }

    try {
      if (deleteFromStorage) {
        await this.filesService.delete(originalFilePath);
      }
      const url = await this.filesService.upload(
        document.buffer,
        filePath,
        document.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteDocument(document: string) {
    const start = document.search('com') + 4;
    const documentFilePath = document.slice(start);

    return await this.filesService.delete(documentFilePath);
  }

  private async getEntityCount() {
    const entityCount = await this.vehiclesRepository.count();

    return entityCount;
  }

  async getVehicleId() {
    const prefix = 'VHC-';

    const entityCount = await this.getEntityCount();

    const uniquePart =
      entityCount !== 0 ? String(entityCount + 1).padStart(4, '0') : '0001'; // Increment or start at 0001

    return `${prefix}${uniquePart}`;
  }

  private mapDataForExport(data: Vehicle[]) {
    const returnData = data.map((e) => {
      const vehicle = {
        id: e.id,
        vehicleId: e.vehicleId,
        name: e.name,
        type: e.type,
        model: e.model,
        licensePlate: e.licensePlate,
        engineType: e.engineType,
        registrationExpiryDate: moment
          .utc(e.registrationExpiryDate)
          .format(dateResMomentFormat),
      };
      return vehicle;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey: VehicleSortKeys.vehicleId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.vehiclesRepository
      .createQueryBuilder('vehicle')
      .where('vehicle.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const vehicles = await query.getMany();
    const mappedVehicles = this.mapDataForExport(vehicles);

    return mappedVehicles;
  }

  async copyPrint(
    sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey: VehicleSortKeys.vehicleId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const vehicles = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Vehicles\n\nID\tName\tType\tModel\tLicense Plate\tRegistration Expiration Date\tEngine Type\n`;

    const data = vehicles
      .map((e) => {
        const id = e.vehicleId || '-';
        const name = e.name || '-';
        const type = e.type || '-';
        const model = e.model || '-';
        const licensePlate = e.licensePlate || '-';
        const registrationExpirationDate = e.registrationExpiryDate || '-';
        const engineType = e.engineType || '-';

        return `${id}\t${name}\t${type}\t${model}\t${licensePlate}\t${registrationExpirationDate}\t${engineType}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = vehicles.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey: VehicleSortKeys.vehicleId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const vehicles = await this.getDataForExport(sortOptions, search);

    const mappedVehicles = vehicles.map((e) => {
      const obj = {
        ID: e.vehicleId,
        Name: e.name,
        Type: e.type,
        Model: e.model,
        'License Plate': e.licensePlate,
        'Registration Expiration Date': e.registrationExpiryDate,
        'Engine Type': e.engineType,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedVehicles);
  }

  async generateExcelFile(
    sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey: VehicleSortKeys.vehicleId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const vehicles = await this.getDataForExport(sortOptions, search);

    const mappedVehicles = vehicles.map((e) => {
      const obj = {
        ID: e.vehicleId,
        Name: e.name,
        Type: e.type,
        Model: e.model,
        'License Plate': e.licensePlate,
        'Registration Expiration Date': e.registrationExpiryDate,
        'Engine Type': e.engineType,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedVehicles, 'Vehicle');
  }

  async generatePdf(
    sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey: VehicleSortKeys.vehicleId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const vehicles = await this.getDataForExport(sortOptions, search);

    const mappedVehicles = vehicles.map((e) => {
      const obj = {
        ID: e.vehicleId,
        Name: e.name,
        Type: e.type,
        Model: e.model,
        'License Plate': e.licensePlate,
        'Registration Expiration Date': e.registrationExpiryDate,
        'Engine Type': e.engineType,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedVehicles,
      'Smart Fleet SaaS - Vehicle',
    );
  }
}
