import { FileFieldsInterceptor } from '@nest-lab/fastify-multer';
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
  UseInterceptors,
  UploadedFiles,
  Req,
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
import { ApiFileBody } from 'src/common/decorators/query/swagger-file-body';
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
import { DocTypesArr, MaxDocSize } from 'src/files/dto/files.dto';
import { FileValidationPipe } from 'src/files/pipes/files-validation-pipe';
import {
  CreateVehicleDto,
  UpdateVehicleDto,
  VehicleFilesUploadDto,
  VehicleSortKeys,
} from 'src/vehicles/dto/vehicle.dto';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';
import { VehiclesService } from 'src/vehicles/services/vehicles/vehicles.service';

@ApiTags('Vehicles')
@Controller('vehicles')
export class VehiclesController extends BaseLogger {
  constructor(private readonly vehiclesService: VehiclesService) {
    super();
  }

  /**
   * Create a vehicle
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Vehicle)
  @ApiFileBody(VehicleFilesUploadDto, CreateVehicleDto)
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Vehicle.name),
  )
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  async create(
    @Body() createVehicleDto: CreateVehicleDto,
    @UploadedFiles(
      new FileValidationPipe([
        {
          fieldName: 'document',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: false,
        },
      ]),
    )
    files: VehicleFilesUploadDto,
  ) {
    try {
      const data = await this.vehiclesService.create(createVehicleDto, files);
      return new APISuccessResponse<Vehicle>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a vehicle
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Vehicle)
  @ApiConsumes('multipart/form-data')
  @ApiFileBody(VehicleFilesUploadDto, UpdateVehicleDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Vehicle.name),
  )
  @UseInterceptors(FileFieldsInterceptor([{ name: 'document', maxCount: 1 }]))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
    @UploadedFiles(
      new FileValidationPipe([
        {
          fieldName: 'document',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: true,
        },
      ]),
    )
    files: VehicleFilesUploadDto,
  ) {
    try {
      const data = await this.vehiclesService.update(
        id,
        updateVehicleDto,
        files,
      );
      return new APISuccessResponse<Vehicle>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Vehicles
   */
  @ApiOkResponseGenericPaginated(Vehicle)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(VehicleSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Vehicle.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey') sortKey: VehicleSortKeys = VehicleSortKeys.vehicleId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehiclesService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<Vehicle[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a Vehicle by id
   */
  @ApiOkResponseGeneric(Vehicle)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Vehicle.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.vehiclesService.findOne({ id });
      return new APISuccessResponse<Vehicle>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a Vehicle
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Vehicle.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.vehiclesService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get vehicles for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Vehicle.name),
  )
  @ApiQuerySortOptions(VehicleSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey') sortKey: VehicleSortKeys = VehicleSortKeys.vehicleId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehiclesService.copyPrint(sortOptions, search);
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get vehicles as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Vehicle.name),
  )
  @ApiQuerySortOptions(VehicleSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: VehicleSortKeys = VehicleSortKeys.vehicleId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehiclesService.generateCsv(sortOptions, search);
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Vehicle.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get vehicles as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Vehicle.name),
  )
  @ApiQuerySortOptions(VehicleSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: VehicleSortKeys = VehicleSortKeys.vehicleId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehiclesService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Vehicle.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get vehicles as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Vehicle.name),
  )
  @ApiQuerySortOptions(VehicleSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: VehicleSortKeys = VehicleSortKeys.vehicleId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehiclesService.generatePdf(sortOptions, search);
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Vehicle.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
