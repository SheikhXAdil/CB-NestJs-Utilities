import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment-timezone';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { SortOptions } from 'src/common/classes/Sorting';
import { ExportService } from 'src/export/export.service';
import {
  CreateVehicleTypeDto,
  UpdateVehicleTypeDto,
  VehicleTypeSortKeys,
} from 'src/system-setup/dto/vehicle-type.dto';
import { VehicleType } from 'src/system-setup/entities/vehicle-type.entity';
import {
  Brackets,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

@Injectable()
export class VehicleTypeService {
  constructor(
    @InjectRepository(VehicleType)
    private readonly vehicleTypesRepository: Repository<VehicleType>,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey: VehicleTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.vehicleTypesRepository
      .createQueryBuilder('type')
      .where('type.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const types = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(types);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<VehicleType>,
    search: string,
  ) {
    if (search) {
      const searchTerms = search.trim().replace(/\s+/g, ' ').split(' '); // removing extra white spaces
      const ilikeConditions = [];
      const parameters = {};

      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `type.type ILIKE :${paramName} OR type.note ILIKE :${paramName} OR CAST(type.numberOfSeats AS TEXT) ILIKE :${paramName}`,
        );
        parameters[paramName] = `%${term}%`;
      });

      query = query.andWhere(
        new Brackets((qb) =>
          qb.andWhere(ilikeConditions.join(' OR '), parameters),
        ),
      );
    }

    return query;
  }

  private applySortingQueryForFindAll(
    query: SelectQueryBuilder<VehicleType>,
    sortOptions: SortOptions<VehicleTypeSortKeys>,
  ) {
    query = query.orderBy(`type.${sortOptions.sortKey}`, sortOptions.sortOrder);
    return query;
  }

  private mapDataForFindAll(data: Pagination<VehicleType>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const type = {
        id: e.id,
        type: e.type,
        note: e.note,
        numberOfSeats: e.numberOfSeats,
      };
      return type;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<VehicleType>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const type = await this.vehicleTypesRepository.findOne({
      where: options,
      relations,
    });

    if (!type && throwException) {
      throw new NotFoundException(`No such Vehicle Type found!`);
    }

    return type;
  }

  async create(createVehicleTypeDto: CreateVehicleTypeDto) {
    const type = this.vehicleTypesRepository.create(createVehicleTypeDto);

    return await this.vehicleTypesRepository.save(type);
  }

  async update(id: string, updateVehicleTypeDto: UpdateVehicleTypeDto) {
    let type: any = await this.findOne({ id });

    type = { ...type, ...updateVehicleTypeDto };

    return await this.vehicleTypesRepository.save(type);
  }

  async remove(id: string) {
    const type = await this.findOne({ id });

    type.deletedAt = moment.tz();
    type.isDeleted = true;

    return await this.vehicleTypesRepository.save(type);
  }

  private mapDataForExport(data: VehicleType[]) {
    const returnData = data.map((e) => {
      const type = {
        id: e.id,
        type: e.type,
        note: e.note,
        numberOfSeats: e.numberOfSeats,
      };
      return type;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey: VehicleTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.vehicleTypesRepository
      .createQueryBuilder('type')
      .where('type.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const types = await query.getMany();
    const mappedTypes = this.mapDataForExport(types);

    return mappedTypes;
  }

  async copyPrint(
    sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey: VehicleTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const types = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Vehicle Types\n\nType\tNo of Seats\tNotes\n`;

    const data = types
      .map((e) => {
        const type = e.type || '';
        const noOfSeats = e.numberOfSeats !== null ? e.numberOfSeats : '-';
        const notes = e.note || '-';

        return `${type}\t${noOfSeats}\t${notes}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = types.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey: VehicleTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const types = await this.getDataForExport(sortOptions, search);

    const mappedTypes = types.map((e) => {
      const obj = {
        Type: e.type,
        Notes: e.note,
        'No of Seats': e.numberOfSeats,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedTypes);
  }

  async generateExcelFile(
    sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey: VehicleTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const types = await this.getDataForExport(sortOptions, search);

    const mappedTypes = types.map((e) => {
      const obj = {
        Type: e.type,
        Notes: e.note,
        'No of Seats': e.numberOfSeats,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedTypes, 'Vehicle Type');
  }

  async generatePdf(
    sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey: VehicleTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const types = await this.getDataForExport(sortOptions, search);

    const mappedTypes = types.map((e) => {
      const obj = {
        Type: e.type,
        Notes: e.note,
        'No of Seats': e.numberOfSeats,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedTypes,
      'Smart Fleet SaaS - Vehicle Type',
    );
  }
}
