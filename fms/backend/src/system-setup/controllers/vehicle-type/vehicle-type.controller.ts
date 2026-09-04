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
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
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
  CreateVehicleTypeDto,
  UpdateVehicleTypeDto,
  VehicleTypeSortKeys,
} from 'src/system-setup/dto/vehicle-type.dto';
import { VehicleType } from 'src/system-setup/entities/vehicle-type.entity';
import { VehicleTypeService } from 'src/system-setup/services/vehicle-type/vehicle-type.service';

@ApiTags('System Setup (Vehicle Types)')
@Controller('systemSetup/vehicleTypes')
export class VehicleTypeController extends BaseLogger {
  constructor(private readonly vehicleTypeService: VehicleTypeService) {
    super();
  }

  /**
   * Create a Vehicle Type
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(VehicleType)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, VehicleType.name),
  )
  @Post()
  async create(@Body() createVehicleTypeDto: CreateVehicleTypeDto) {
    try {
      const data = await this.vehicleTypeService.create(createVehicleTypeDto);
      return new APISuccessResponse<VehicleType>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a vehicle type
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(VehicleType)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, VehicleType.name),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleTypeDto: UpdateVehicleTypeDto,
  ) {
    try {
      const data = await this.vehicleTypeService.update(
        id,
        updateVehicleTypeDto,
      );
      return new APISuccessResponse<VehicleType>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Vehicle Types
   */
  @ApiOkResponseGenericPaginated(VehicleType)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(VehicleTypeSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, VehicleType.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey')
    sortKey: VehicleTypeSortKeys = VehicleTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleTypeService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<VehicleType[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a Vehicle Type
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, VehicleType.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.vehicleTypeService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get vehicle types for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, VehicleType.name),
  )
  @ApiQuerySortOptions(VehicleTypeSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey') sortKey: VehicleTypeSortKeys = VehicleTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleTypeService.copyPrint(sortOptions, search);
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get vehicle types as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, VehicleType.name),
  )
  @ApiQuerySortOptions(VehicleTypeSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: VehicleTypeSortKeys = VehicleTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleTypeService.generateCsv(
        sortOptions,
        search,
      );
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Vehicle Type.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get vehicle types as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, VehicleType.name),
  )
  @ApiQuerySortOptions(VehicleTypeSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: VehicleTypeSortKeys = VehicleTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleTypeService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Vehicle Type.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get Vehicle Types as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, VehicleType.name),
  )
  @ApiQuerySortOptions(VehicleTypeSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: VehicleTypeSortKeys = VehicleTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleTypeService.generatePdf(
        sortOptions,
        search,
      );
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Vehicle Type.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
