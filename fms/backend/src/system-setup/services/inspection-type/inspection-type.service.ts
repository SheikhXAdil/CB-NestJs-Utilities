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
  CreateInspectionTypeDto,
  InspectionTypeSortKeys,
  UpdateInspectionTypeDto,
} from 'src/system-setup/dto/inspection-type.dto';
import { InspectionType } from 'src/system-setup/entities/inspection-type.entity';
import {
  Brackets,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';

@Injectable()
export class InspectionTypeService {
  constructor(
    @InjectRepository(InspectionType)
    private readonly inspectionTypesRepository: Repository<InspectionType>,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey: InspectionTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.inspectionTypesRepository
      .createQueryBuilder('type')
      .where('type.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const types = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(types);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<InspectionType>,
    search: string,
  ) {
    if (search) {
      const searchTerms = search.trim().replace(/\s+/g, ' ').split(' '); // removing extra white spaces
      const ilikeConditions = [];
      const parameters = {};

      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(`type.type ILIKE :${paramName}`);
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
    query: SelectQueryBuilder<InspectionType>,
    sortOptions: SortOptions<InspectionTypeSortKeys>,
  ) {
    query = query.orderBy(`type.${sortOptions.sortKey}`, sortOptions.sortOrder);
    return query;
  }

  private mapDataForFindAll(data: Pagination<InspectionType>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const type = {
        id: e.id,
        type: e.type,
      };
      return type;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<InspectionType>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const type = await this.inspectionTypesRepository.findOne({
      where: options,
      relations,
    });

    if (!type && throwException) {
      throw new NotFoundException(`No such Inspection Type found!`);
    }

    return type;
  }

  async create(createInspectionTypeDto: CreateInspectionTypeDto) {
    const type = this.inspectionTypesRepository.create(createInspectionTypeDto);

    return await this.inspectionTypesRepository.save(type);
  }

  async update(id: string, updateInspectionTypeDto: UpdateInspectionTypeDto) {
    let type: any = await this.findOne({ id });

    type = { ...type, ...updateInspectionTypeDto };

    return await this.inspectionTypesRepository.save(type);
  }

  async remove(id: string) {
    const type = await this.findOne({ id });

    type.deletedAt = moment.tz();
    type.isDeleted = true;

    return await this.inspectionTypesRepository.save(type);
  }

  async getAllTypes() {
    const types = await this.inspectionTypesRepository.find({
      select: {
        type: true,
      },
    });

    const typesArr = types.map((e) => e.type);

    return typesArr;
  }

  private mapDataForExport(data: InspectionType[]) {
    const returnData = data.map((e) => {
      const type = {
        id: e.id,
        type: e.type,
      };
      return type;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey: InspectionTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.inspectionTypesRepository
      .createQueryBuilder('type')
      .where('type.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const types = await query.getMany();
    const mappedTypes = this.mapDataForExport(types);

    return mappedTypes;
  }

  async copyPrint(
    sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey: InspectionTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const types = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Inspection Types\n\nType\n`;

    const data = types
      .map((e) => {
        const type = e.type || '';

        return `${type}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = types.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey: InspectionTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const types = await this.getDataForExport(sortOptions, search);

    const mappedTypes = types.map((e) => {
      const obj = {
        Type: e.type,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedTypes);
  }

  async generateExcelFile(
    sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey: InspectionTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const types = await this.getDataForExport(sortOptions, search);

    const mappedTypes = types.map((e) => {
      const obj = {
        Type: e.type,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedTypes, 'Inspection Type');
  }

  async generatePdf(
    sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey: InspectionTypeSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const types = await this.getDataForExport(sortOptions, search);

    const mappedTypes = types.map((e) => {
      const obj = {
        Type: e.type,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedTypes,
      'Smart Fleet SaaS - Inspection Type',
    );
  }
}
