import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/casl-ability.factory/actions.enum';
import { CoreAppAbility } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { BaseLogger } from 'src/common/classes/BaseLogger';
import {
  APIFailureResponse,
  APIPaginatedResponse,
  APISuccessResponse,
} from 'src/common/classes/BaseResponse';
import { PrintCopyDataResDto } from 'src/common/classes/CopyPrintPayload';
import { SortOptions, SortOrder } from 'src/common/classes/Sorting';
import { ApiPaginatedQueryOptions } from 'src/common/decorators/query/swagger-pagination-options';
import {
  ApiQuerySortOptions,
  ApiSearchQueryParam,
} from 'src/common/decorators/query/swagger-sort-search';
import {
  ApiOkResponseCsv,
  ApiOkResponseExcel,
  ApiOkResponseGeneric,
  ApiOkResponseGenericPaginated,
  ApiOkResponsePdf,
} from 'src/common/decorators/response/generic-responses';
import {
  CheckPolicies,
  PoliciesGuard,
} from 'src/common/guards/policy-guard/policyGuard';
import { PositiveNumericQueryParamValidationPipe } from 'src/common/pipes/numeric-string-validation.pipe';
import { getErrorStatusCode } from 'src/common/utilities/err-status';
import {
  CreateVehicleInspectionDto,
  UpdateVehicleInspectionDto,
  VehicleInspectionSortKeys,
} from 'src/vehicle-inspections/dto/vehicle-inspection.dto';
import { Inspection } from 'src/vehicle-inspections/entities/vehicle-inspection.entity';
import { VehicleInspectionsService } from 'src/vehicle-inspections/services/vehicle-inspections/vehicle-inspections.service';

@ApiTags('Vehicle Inspection')
@Controller('vehicleInspections')
export class VehicleInspectionsController extends BaseLogger {
  constructor(
    private readonly vehicleInspectionsService: VehicleInspectionsService,
  ) {
    super();
  }

  /**
   * Create a vehicle inspection
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Inspection)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Inspection.name),
  )
  @Post()
  async create(@Body() createVehicleInspectionDto: CreateVehicleInspectionDto) {
    try {
      const data = await this.vehicleInspectionsService.create(
        createVehicleInspectionDto,
      );
      return new APISuccessResponse<Inspection>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a vehicle inspection
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Inspection)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Inspection.name),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleInspectionDto: UpdateVehicleInspectionDto,
  ) {
    try {
      const data = await this.vehicleInspectionsService.update(
        id,
        updateVehicleInspectionDto,
      );
      return new APISuccessResponse<Inspection>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Vehicle inspections
   */
  @ApiOkResponseGenericPaginated(Inspection)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(VehicleInspectionSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Inspection.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey')
    sortKey: VehicleInspectionSortKeys = VehicleInspectionSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleInspectionsService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<Inspection[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a vehicle inspection by id
   */
  @ApiOkResponseGeneric(Inspection)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Inspection.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.vehicleInspectionsService.findOne({ id }, [
        'inspectionVehicle',
        'inspectionBy',
      ]);
      return new APISuccessResponse<Inspection>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a vehicle inspection
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Inspection.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.vehicleInspectionsService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get inspections for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Inspection.name),
  )
  @ApiQuerySortOptions(VehicleInspectionSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey')
    sortKey: VehicleInspectionSortKeys = VehicleInspectionSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleInspectionsService.copyPrint(
        sortOptions,
        search,
      );
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get inspections as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Inspection.name),
  )
  @ApiQuerySortOptions(VehicleInspectionSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: VehicleInspectionSortKeys = VehicleInspectionSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleInspectionsService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Inspections.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get inspections as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Inspection.name),
  )
  @ApiQuerySortOptions(VehicleInspectionSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: VehicleInspectionSortKeys = VehicleInspectionSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleInspectionsService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Inspection.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get inspection as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Inspection.name),
  )
  @ApiQuerySortOptions(VehicleInspectionSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: VehicleInspectionSortKeys = VehicleInspectionSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleInspectionSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleInspectionsService.generatePdf(
        sortOptions,
        search,
      );
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Inspection.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
