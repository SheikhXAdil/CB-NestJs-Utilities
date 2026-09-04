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
  CreateDriverDto,
  DriverFilesUploadDto,
  DriverSortKeys,
  UpdateDriverDto,
} from 'src/drivers/dto/driver.dto';
import { Driver } from 'src/drivers/entities/driver.entity';
import { FilesService } from 'src/files/services/files/files.service';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly driversRepository: Repository<Driver>,
    private readonly filesService: FilesService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<DriverSortKeys> = {
      sortKey: DriverSortKeys.driverId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.driversRepository
      .createQueryBuilder('driver')
      .where('driver.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const drivers = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(drivers);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Driver>,
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
        dateCondition.push(`EXTRACT(MONTH FROM driver.issueDate) = :month`);
        dateCondition.push(
          `EXTRACT(MONTH FROM driver.expirationDate) = :month`,
        );
        parameters['month'] = month;
      }

      // Add text search filters
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `driver.phoneNumber ILIKE :${paramName} OR driver.name ILIKE :${paramName} OR driver.email ILIKE :${paramName} OR driver.licenseNumber ILIKE :${paramName}`,
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
    query: SelectQueryBuilder<Driver>,
    sortOptions: SortOptions<DriverSortKeys>,
  ) {
    query = query.orderBy(
      `driver.${sortOptions.sortKey}`,
      sortOptions.sortOrder,
    );
    return query;
  }

  private mapDataForFindAll(data: Pagination<Driver>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const driver = {
        id: e.id,
        driverId: e.driverId,
        email: e.email,
        phoneNumber: e.phoneNumber,
        name: e.name,
        licenseNumber: e.licenseNumber,
        issueDate: moment.utc(e.issueDate).format(dateResMomentFormat),
        expirationDate: moment
          .utc(e.expirationDate)
          .format(dateResMomentFormat),
      };
      return driver;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Driver>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const driver = await this.driversRepository.findOne({
      where: options,
      relations,
    });

    if (!driver && throwException) {
      throw new NotFoundException(`No such Driver found!`);
    }

    return driver;
  }

  async create(createDriverDto: CreateDriverDto, files: DriverFilesUploadDto) {
    const driver = this.driversRepository.create(createDriverDto);

    driver.joiningDate = moment.utc(createDriverDto.joiningDate, 'DD/MM/YYYY');

    driver.issueDate = moment.utc(createDriverDto.issueDate, 'DD/MM/YYYY');

    driver.expirationDate = moment.utc(
      createDriverDto.expirationDate,
      'DD/MM/YYYY',
    );

    driver.driverId = await this.getDriverId();

    const savedDriver = await this.driversRepository.save(driver);

    if (files.license.length === 0 && files.document.length === 0) {
      return savedDriver;
    }

    if (files.license.length > 0) {
      savedDriver.license = await this.uploadLicense(
        savedDriver.id,
        files.license[0],
      );
    }

    if (files.document.length > 0) {
      savedDriver.document = await this.uploadDocument(
        savedDriver.id,
        files.document[0],
      );
    }

    return await this.driversRepository.save(savedDriver);
  }

  async update(
    id: string,
    updateDriverDto: UpdateDriverDto,
    files: DriverFilesUploadDto,
  ) {
    let driver: any = await this.findOne({ id });

    driver = { ...driver, ...updateDriverDto };

    if (updateDriverDto.joiningDate) {
      driver.joiningDate = moment.utc(
        updateDriverDto.joiningDate,
        'DD/MM/YYYY',
      );
    }

    if (updateDriverDto.issueDate) {
      driver.issueDate = moment.utc(updateDriverDto.issueDate, 'DD/MM/YYYY');
    }

    if (updateDriverDto.expirationDate) {
      driver.expirationDate = moment.utc(
        updateDriverDto.expirationDate,
        'DD/MM/YYYY',
      );
    }

    if (files.license.length > 0) {
      driver.license = await this.updateLicense(driver, files.license[0]);
    }
    if (files.document.length > 0) {
      driver.document = await this.updateDocument(driver, files.document[0]);
    }

    return await this.driversRepository.save(driver);
  }

  async remove(id: string) {
    const driver = await this.findOne({ id });

    driver.deletedAt = moment.tz();
    driver.isDeleted = true;

    return await this.driversRepository.save(driver);
  }

  async uploadLicense(userId: string, license: MemoryStorageFile) {
    const hash = createHash('md5').update(userId).digest('hex');
    const imageType: string = license.mimetype.split('/').pop();
    const filePath = `drivers/${userId}/license/${hash}${moment().unix()}.${imageType}`;

    try {
      const url = await this.filesService.upload(
        license.buffer,
        filePath,
        license.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateLicense(driver: Driver, license: MemoryStorageFile) {
    let deleteFromStorage = false;

    if (!driver.license) {
      return this.uploadLicense(driver.id, license);
    }

    const start = driver.license.search('com') + 4;
    const originalFilePath = driver.license.slice(start);

    const hash = createHash('md5').update(driver.id).digest('hex');
    const imageType: string = license.mimetype.split('/').pop();
    const filePath = `drivers/${driver.id}/license/${hash}${moment().unix()}.${imageType}`;

    if (filePath !== originalFilePath) {
      deleteFromStorage = true;
    }

    try {
      if (deleteFromStorage) {
        await this.filesService.delete(originalFilePath);
      }
      const url = await this.filesService.upload(
        license.buffer,
        filePath,
        license.mimetype,
      );
      return url;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async deleteLicense(license: string) {
    const start = license.search('com') + 4;
    const licenseFilePath = license.slice(start);

    return await this.filesService.delete(licenseFilePath);
  }

  async uploadDocument(userId: string, document: MemoryStorageFile) {
    const hash = createHash('md5').update(userId).digest('hex');
    const imageType: string = document.mimetype.split('/').pop();
    const filePath = `drivers/${userId}/document/${hash}${moment().unix()}.${imageType}`;

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

  async updateDocument(driver: Driver, document: MemoryStorageFile) {
    let deleteFromStorage = false;

    if (!driver.document) {
      return this.uploadDocument(driver.id, document);
    }

    const start = driver.document.search('com') + 4;
    const originalFilePath = driver.document.slice(start);

    const hash = createHash('md5').update(driver.id).digest('hex');
    const imageType: string = document.mimetype.split('/').pop();
    const filePath = `drivers/${driver.id}/document/${hash}${moment().unix()}.${imageType}`;

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
    const entityCount = await this.driversRepository.count();

    return entityCount;
  }

  async getDriverId() {
    const prefix = 'DRV-';

    const entityCount = await this.getEntityCount();

    const uniquePart =
      entityCount !== 0 ? String(entityCount + 1).padStart(4, '0') : '0001'; // Increment or start at 0001

    return `${prefix}${uniquePart}`;
  }

  private mapDataForExport(data: Driver[]) {
    const returnData = data.map((e) => {
      const driver = {
        id: e.id,
        driverId: e.driverId,
        email: e.email,
        phoneNumber: e.phoneNumber,
        name: e.name,
        licenseNumber: e.licenseNumber,
        issueDate: moment.utc(e.issueDate).format(dateResMomentFormat),
        expirationDate: moment
          .utc(e.expirationDate)
          .format(dateResMomentFormat),
      };
      return driver;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<DriverSortKeys> = {
      sortKey: DriverSortKeys.driverId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.driversRepository
      .createQueryBuilder('driver')
      .where('driver.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const drivers = await query.getMany();
    const mappedDrivers = this.mapDataForExport(drivers);

    return mappedDrivers;
  }

  async copyPrint(
    sortOptions: SortOptions<DriverSortKeys> = {
      sortKey: DriverSortKeys.driverId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const drivers = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Drivers\n\nID\tDriver\tEmail\tPhone Number\tLicense Number\tIssue Date\tExpiration Date\n`;

    const data = drivers
      .map((e) => {
        const driverId = e.driverId || '-';
        const driverName = e.name || '-';
        const email = e.email || '-';
        const phoneNumber = e.phoneNumber || '-';
        const licenseNumber = e.licenseNumber || '-';
        const issueDate = e.issueDate || '-';
        const expirationDate = e.expirationDate || '-';

        return `${driverId}\t${driverName}\t${email}\t${phoneNumber}\t${licenseNumber}\t${issueDate}\t${expirationDate}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = drivers.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<DriverSortKeys> = {
      sortKey: DriverSortKeys.driverId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const drivers = await this.getDataForExport(sortOptions, search);

    const mappedDrivers = drivers.map((e) => {
      const obj = {
        ID: e.driverId,
        Driver: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        'License Number': e.licenseNumber,
        'Issue Date': e.issueDate,
        'Expiration Date': e.expirationDate,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedDrivers);
  }

  async generateExcelFile(
    sortOptions: SortOptions<DriverSortKeys> = {
      sortKey: DriverSortKeys.driverId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const drivers = await this.getDataForExport(sortOptions, search);

    const mappedDrivers = drivers.map((e) => {
      const obj = {
        ID: e.driverId,
        Driver: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        'License Number': e.licenseNumber,
        'Issue Date': e.issueDate,
        'Expiration Date': e.expirationDate,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedDrivers, 'Driver');
  }

  async generatePdf(
    sortOptions: SortOptions<DriverSortKeys> = {
      sortKey: DriverSortKeys.driverId,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const drivers = await this.getDataForExport(sortOptions, search);

    const mappedDrivers = drivers.map((e) => {
      const obj = {
        ID: e.driverId,
        Driver: e.name,
        Email: e.email,
        'Phone Number': e.phoneNumber,
        'License Number': e.licenseNumber,
        'Issue Date': e.issueDate,
        'Expiration Date': e.expirationDate,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedDrivers,
      'Smart Fleet SaaS - Driver',
    );
  }
}
