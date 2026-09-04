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
import {
  CreateDriverDto,
  DriverFilesUploadDto,
  DriverSortKeys,
  UpdateDriverDto,
} from 'src/drivers/dto/driver.dto';
import { Driver } from 'src/drivers/entities/driver.entity';
import { DriversService } from 'src/drivers/services/driver/drivers.service';
import { DocTypesArr, MaxDocSize } from 'src/files/dto/files.dto';
import { FileValidationPipe } from 'src/files/pipes/files-validation-pipe';

@ApiTags('Drivers')
@Controller('drivers')
export class DriversController extends BaseLogger {
  constructor(private readonly driversService: DriversService) {
    super();
  }

  /**
   * Create a Driver
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Driver)
  @ApiFileBody(DriverFilesUploadDto, CreateDriverDto)
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Driver.name),
  )
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'license', maxCount: 1 },
      { name: 'document', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createDriverDto: CreateDriverDto,
    @UploadedFiles(
      new FileValidationPipe([
        {
          fieldName: 'license',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: false,
        },
        {
          fieldName: 'document',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: false,
        },
      ]),
    )
    files: DriverFilesUploadDto,
  ) {
    try {
      const data = await this.driversService.create(createDriverDto, files);
      return new APISuccessResponse<Driver>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a Driver
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Driver)
  @ApiConsumes('multipart/form-data')
  @ApiFileBody(DriverFilesUploadDto, UpdateDriverDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Driver.name),
  )
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'license', maxCount: 1 },
      { name: 'document', maxCount: 1 },
    ]),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDriverDto: UpdateDriverDto,
    @UploadedFiles(
      new FileValidationPipe([
        {
          fieldName: 'license',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: true,
        },
        {
          fieldName: 'document',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: true,
        },
      ]),
    )
    files: DriverFilesUploadDto,
  ) {
    try {
      const data = await this.driversService.update(id, updateDriverDto, files);
      return new APISuccessResponse<Driver>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Drivers
   */
  @ApiOkResponseGenericPaginated(Driver)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(DriverSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Driver.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey') sortKey: DriverSortKeys = DriverSortKeys.driverId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<DriverSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.driversService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<Driver[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a Driver by id
   */
  @ApiOkResponseGeneric(Driver)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Driver.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.driversService.findOne({ id });
      return new APISuccessResponse<Driver>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a Driver
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Driver.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.driversService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get drivers for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Driver.name),
  )
  @ApiQuerySortOptions(DriverSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey') sortKey: DriverSortKeys = DriverSortKeys.driverId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<DriverSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.driversService.copyPrint(sortOptions, search);
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get drivers as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Driver.name),
  )
  @ApiQuerySortOptions(DriverSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: DriverSortKeys = DriverSortKeys.driverId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<DriverSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.driversService.generateCsv(sortOptions, search);
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Driver.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get driver as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Driver.name),
  )
  @ApiQuerySortOptions(DriverSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: DriverSortKeys = DriverSortKeys.driverId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<DriverSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.driversService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Driver.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get drivers as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Driver.name),
  )
  @ApiQuerySortOptions(DriverSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: DriverSortKeys = DriverSortKeys.driverId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<DriverSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.driversService.generatePdf(sortOptions, search);
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Driver.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
