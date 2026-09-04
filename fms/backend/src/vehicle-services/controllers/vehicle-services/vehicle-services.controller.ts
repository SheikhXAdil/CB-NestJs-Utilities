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
  CreateVehicleServiceDto,
  UpdateVehicleServiceDto,
  VehicleServiceFilesUploadDto,
  VehicleServiceSortKeys,
} from 'src/vehicle-services/dto/vehicle-service.dto';
import { Service } from 'src/vehicle-services/entities/vehicle-service.entity';
import { VehicleServicesService } from 'src/vehicle-services/services/vehicle-services/vehicle-services.service';

@ApiTags('Vehicle Service')
@Controller('vehicleServices')
export class VehicleServicesController extends BaseLogger {
  constructor(private readonly vehicleServicesService: VehicleServicesService) {
    super();
  }

  /**
   * Create a vehicle service
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Service)
  @ApiFileBody(VehicleServiceFilesUploadDto, CreateVehicleServiceDto)
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Service.name),
  )
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'attachment', maxCount: 1 }]))
  async create(
    @Body() createVehicleServiceDto: CreateVehicleServiceDto,
    @UploadedFiles(
      new FileValidationPipe([
        {
          fieldName: 'attachment',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: true,
        },
      ]),
    )
    files: VehicleServiceFilesUploadDto,
  ) {
    try {
      const data = await this.vehicleServicesService.create(
        createVehicleServiceDto,
        files,
      );
      return new APISuccessResponse<Service>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a vehicle service
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Service)
  @ApiConsumes('multipart/form-data')
  @ApiFileBody(VehicleServiceFilesUploadDto, UpdateVehicleServiceDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Service.name),
  )
  @UseInterceptors(FileFieldsInterceptor([{ name: 'attachment', maxCount: 1 }]))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateVehicleServiceDto: UpdateVehicleServiceDto,
    @UploadedFiles(
      new FileValidationPipe([
        {
          fieldName: 'attachment',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: true,
        },
      ]),
    )
    files: VehicleServiceFilesUploadDto,
  ) {
    try {
      const data = await this.vehicleServicesService.update(
        id,
        updateVehicleServiceDto,
        files,
      );
      return new APISuccessResponse<Service>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Vehicle Services
   */
  @ApiOkResponseGenericPaginated(Service)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(VehicleServiceSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Service.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey')
    sortKey: VehicleServiceSortKeys = VehicleServiceSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleServicesService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<Service[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a vehicle service by id
   */
  @ApiOkResponseGeneric(Service)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Service.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.vehicleServicesService.findOne({ id }, [
        'vehicle',
      ]);
      return new APISuccessResponse<Service>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a vehicle service
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Service.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.vehicleServicesService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get services for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Service.name),
  )
  @ApiQuerySortOptions(VehicleServiceSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey')
    sortKey: VehicleServiceSortKeys = VehicleServiceSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleServicesService.copyPrint(
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
   * Get services as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Service.name),
  )
  @ApiQuerySortOptions(VehicleServiceSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: VehicleServiceSortKeys = VehicleServiceSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleServicesService.generateCsv(
        sortOptions,
        search,
      );
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Service.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get services as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Service.name),
  )
  @ApiQuerySortOptions(VehicleServiceSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: VehicleServiceSortKeys = VehicleServiceSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleServicesService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Service.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get services as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Service.name),
  )
  @ApiQuerySortOptions(VehicleServiceSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: VehicleServiceSortKeys = VehicleServiceSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<VehicleServiceSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.vehicleServicesService.generatePdf(
        sortOptions,
        search,
      );
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Service.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
