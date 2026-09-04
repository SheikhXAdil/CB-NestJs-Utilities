import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as moment from 'moment-timezone';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { UsersService } from 'src/users/services/users/users.service';
import { InspectionTypeService } from 'src/system-setup/services/inspection-type/inspection-type.service';
import {
  CreateVehicleInspectionDto,
  InspectionChecklistDto,
  UpdateVehicleInspectionDto,
  VehicleInspectionSortKeys,
} from 'src/vehicle-inspections/dto/vehicle-inspection.dto';
import { Inspection } from 'src/vehicle-inspections/entities/vehicle-inspection.entity';
import { VehiclesService } from 'src/vehicles/services/vehicles/vehicles.service';
import { FindOptionsWhere, Repository, SelectQueryBuilder } from 'typeorm';
import { dateResMomentFormat } from 'src/common/utilities/formats';
import { SortOptions } from 'src/common/classes/Sorting';
import { ExportService } from 'src/export/export.service';

@Injectable()
export class VehicleInspectionsService {
  constructor(
    @InjectRepository(Inspection)
    private readonly vehicleInspectionsRepository: Repository<Inspection>,
    private readonly vehiclesService: VehiclesService,
    private readonly usersService: UsersService,
    private readonly inspectionTypeService: InspectionTypeService,
    private readonly exportService: ExportService,
  ) {}

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey: VehicleInspectionSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.vehicleInspectionsRepository
      .createQueryBuilder('inspection')
      .leftJoinAndSelect('inspection.inspectionVehicle', 'inspectionVehicle')
      .leftJoinAndSelect('inspection.inspectionBy', 'inspectionBy')
      .where('inspection.isDeleted = false');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const inspections = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(inspections);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Inspection>,
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
          `EXTRACT(MONTH FROM inspection.inspectionDate) = :month`,
        );
        parameters['month'] = month;
      }

      // Add text search filters
      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(
          `inspectionVehicle.name ILIKE :${paramName} OR inspectionBy.name ILIKE :${paramName} OR inspection.inspectionStatus ILIKE :${paramName} OR inspection.repairStatus ILIKE :${paramName}`,
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
    query: SelectQueryBuilder<Inspection>,
    sortOptions: SortOptions<VehicleInspectionSortKeys>,
  ) {
    if (
      sortOptions.sortKey === VehicleInspectionSortKeys.inspectionVehicleName
    ) {
      query = query.orderBy(`inspectionVehicle.name`, sortOptions.sortOrder);
    } else if (
      sortOptions.sortKey === VehicleInspectionSortKeys.inspectionByName
    ) {
      query = query.orderBy(`inspectionBy.name`, sortOptions.sortOrder);
    } else {
      query = query.orderBy(
        `inspection.${sortOptions.sortKey}`,
        sortOptions.sortOrder,
      );
    }

    return query;
  }

  private mapDataForFindAll(data: Pagination<Inspection>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const inspection = {
        id: e.id,
        inspectionStatus: e.inspectionStatus,
        repairStatus: e.repairStatus,
        inspectionDate: moment(e.inspectionDate).format(dateResMomentFormat),
        inspectionVehicleName: e.inspectionVehicle
          ? e.inspectionVehicle.name
          : '-',
        inspectionByName: e.inspectionBy ? e.inspectionBy.name : '-',
      };
      return inspection;
    });

    return returnData;
  }

  async findOne(
    options: FindOptionsWhere<Inspection>,
    relations: string[] = [],
    throwException: boolean = true,
    checkIfNotDeleted: boolean = true,
  ) {
    if (checkIfNotDeleted) {
      options.isDeleted = false;
    }

    const inspection = await this.vehicleInspectionsRepository.findOne({
      where: options,
      relations,
    });

    if (!inspection && throwException) {
      throw new NotFoundException(`No such Inspection found!`);
    }

    return inspection;
  }

  async create(createVehicleInspectionDto: CreateVehicleInspectionDto) {
    const inspection = this.vehicleInspectionsRepository.create(
      createVehicleInspectionDto,
    );

    inspection.inspectionDate = moment.utc(
      createVehicleInspectionDto.inspectionDate,
      'DD/MM/YYYY',
      true,
    );

    inspection.ongoingDateTime = moment.utc(
      createVehicleInspectionDto.ongoingDateTime,
      'DD/MM/YYYY HH:mm',
      true,
    );

    inspection.incomingDateTime = moment.utc(
      createVehicleInspectionDto.incomingDateTime,
      'DD/MM/YYYY HH:mm',
      true,
    );

    const inspectionVehicle = await this.vehiclesService.findOne({
      id: createVehicleInspectionDto.inspectionVehicleId,
    });
    inspection.inspectionVehicle = inspectionVehicle;

    const inspectionBy = await this.usersService.findOne({
      id: createVehicleInspectionDto.inspectionById,
    });
    inspection.inspectionBy = inspectionBy;

    inspection.inspectionChecklist = await this.validateInspectionCheckList(
      createVehicleInspectionDto.inspectionChecklist,
    );

    return await this.vehicleInspectionsRepository.save(inspection);
  }

  async update(
    id: string,
    updateVehicleInspectionDto: UpdateVehicleInspectionDto,
  ) {
    let inspection: any = await this.findOne({ id });

    inspection = { ...inspection, ...updateVehicleInspectionDto };

    if (updateVehicleInspectionDto.inspectionChecklist) {
      inspection.inspectionChecklist = await this.validateInspectionCheckList(
        updateVehicleInspectionDto.inspectionChecklist,
      );
    }

    if (updateVehicleInspectionDto.inspectionDate) {
      inspection.inspectionDate = moment.utc(
        updateVehicleInspectionDto.inspectionDate,
        'DD/MM/YYYY',
        true,
      );
    }

    if (updateVehicleInspectionDto.ongoingDateTime) {
      inspection.ongoingDateTime = moment.utc(
        updateVehicleInspectionDto.ongoingDateTime,
        'DD/MM/YYYY HH:mm',
        true,
      );
    }
    if (updateVehicleInspectionDto.incomingDateTime) {
      inspection.incomingDateTime = moment.utc(
        updateVehicleInspectionDto.incomingDateTime,
        'DD/MM/YYYY HH:mm',
        true,
      );
    }
    return await this.vehicleInspectionsRepository.save(inspection);
  }

  async remove(id: string) {
    const inspection = await this.findOne({ id });

    inspection.deletedAt = moment.tz();
    inspection.isDeleted = true;

    return await this.vehicleInspectionsRepository.save(inspection);
  }

  async validateInspectionCheckList(
    inspectionChecklist: InspectionChecklistDto,
  ) {
    const allTypesArr = await this.inspectionTypeService.getAllTypes();

    for (const check of inspectionChecklist) {
      if (!allTypesArr.includes(check.type)) {
        throw new NotFoundException(
          `No such inspection type exists. type: ${check.type}`,
        );
      }
    }

    const notMarkedTypes = allTypesArr.filter(
      (type) => !inspectionChecklist.find((e) => e.type === type),
    );

    for (const type of notMarkedTypes) {
      inspectionChecklist.push({
        type,
        check: false,
        note: '',
      });
    }

    return inspectionChecklist;
  }

  private mapDataForExport(data: Inspection[]) {
    const returnData = data.map((e) => {
      const inspection = {
        id: e.id,
        inspectionStatus: e.inspectionStatus,
        repairStatus: e.repairStatus,
        inspectionDate: moment(e.inspectionDate).format(dateResMomentFormat),
        inspectionVehicleName: e.inspectionVehicle
          ? e.inspectionVehicle.name
          : '-',
        inspectionByName: e.inspectionBy ? e.inspectionBy.name : '-',
      };
      return inspection;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey: VehicleInspectionSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.vehicleInspectionsRepository
      .createQueryBuilder('inspection')
      .leftJoinAndSelect('inspection.inspectionVehicle', 'inspectionVehicle')
      .leftJoinAndSelect('inspection.inspectionBy', 'inspectionBy')
      .where('inspection.isDeleted = false');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const inspections = await query.getMany();
    const mappedInspections = this.mapDataForExport(inspections);

    return mappedInspections;
  }

  async copyPrint(
    sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey: VehicleInspectionSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const inspections = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Inspections\n\nVehicle\tInspection Date\tInspection By\tInspection Status\tRepair Status\n`;

    const data = inspections
      .map((e) => {
        const vehicle = e.inspectionVehicleName || '-';
        const inspectionDate = e.inspectionDate || '-';
        const inspectionBy = e.inspectionByName || '-';
        const inspectionStatus = e.inspectionStatus || '-';
        const repairStatus = e.repairStatus || '-';

        return `${vehicle}\t${inspectionDate}\t${inspectionBy}\t${inspectionStatus}\t${repairStatus}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = inspections.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey: VehicleInspectionSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const inspections = await this.getDataForExport(sortOptions, search);

    const mappedInspections = inspections.map((e) => {
      const obj = {
        Vehicle: e.inspectionVehicleName,
        'Inspection Date': e.inspectionDate,
        'Inspection By': e.inspectionByName,
        'Inspection Status': e.inspectionStatus,
        'Repair Status': e.repairStatus,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedInspections);
  }

  async generateExcelFile(
    sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey: VehicleInspectionSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const inspections = await this.getDataForExport(sortOptions, search);

    const mappedInspections = inspections.map((e) => {
      const obj = {
        Vehicle: e.inspectionVehicleName,
        'Inspection Date': e.inspectionDate,
        'Inspection By': e.inspectionByName,
        'Inspection Status': e.inspectionStatus,
        'Repair Status': e.repairStatus,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(
      mappedInspections,
      'Inspection',
    );
  }

  async generatePdf(
    sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey: VehicleInspectionSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const inspections = await this.getDataForExport(sortOptions, search);

    const mappedInspections = inspections.map((e) => {
      const obj = {
        Vehicle: e.inspectionVehicleName,
        'Inspection Date': e.inspectionDate,
        'Inspection By': e.inspectionByName,
        'Inspection Status': e.inspectionStatus,
        'Repair Status': e.repairStatus,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedInspections,
      'Smart Fleet SaaS - Inspection',
    );
  }
}
