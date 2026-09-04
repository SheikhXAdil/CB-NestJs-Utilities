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
  CreateFuelDto,
  FuelFilesUploadDto,
  FuelSortKeys,
  UpdateFuelDto,
} from 'src/fuel/dto/fuel.dto';
import { Fuel } from 'src/fuel/entities/fuel.entity';
import { FuelService } from 'src/fuel/services/fuel/fuel.service';

@ApiTags('Fuel')
@Controller('fuel')
export class FuelController extends BaseLogger {
  constructor(private readonly fuelService: FuelService) {
    super();
  }

  /**
   * Create a fuel entity
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Fuel)
  @ApiFileBody(FuelFilesUploadDto, CreateFuelDto)
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Fuel.name),
  )
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'receipt', maxCount: 1 }]))
  async create(
    @Body() createFuelDto: CreateFuelDto,
    @UploadedFiles(
      new FileValidationPipe([
        {
          fieldName: 'receipt',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: true,
        },
      ]),
    )
    files: FuelFilesUploadDto,
  ) {
    try {
      const data = await this.fuelService.create(createFuelDto, files);
      return new APISuccessResponse<Fuel>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a fuel entity
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Fuel)
  @ApiConsumes('multipart/form-data')
  @ApiFileBody(FuelFilesUploadDto, UpdateFuelDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Fuel.name),
  )
  @UseInterceptors(FileFieldsInterceptor([{ name: 'receipt', maxCount: 1 }]))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateFuelDto: UpdateFuelDto,
    @UploadedFiles(
      new FileValidationPipe([
        {
          fieldName: 'receipt',
          maxSize: MaxDocSize,
          allowedTypes: DocTypesArr,
          optional: true,
        },
      ]),
    )
    files: FuelFilesUploadDto,
  ) {
    try {
      const data = await this.fuelService.update(id, updateFuelDto, files);
      return new APISuccessResponse<Fuel>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Fuel entities
   */
  @ApiOkResponseGenericPaginated(Fuel)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(FuelSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Fuel.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey') sortKey: FuelSortKeys = FuelSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<FuelSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.fuelService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<Fuel[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a fuel entity by id
   */
  @ApiOkResponseGeneric(Fuel)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Fuel.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.fuelService.findOne({ id }, ['Fuel', 'driver']);
      return new APISuccessResponse<Fuel>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a fuel entity
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Fuel.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.fuelService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get fuels for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Fuel.name),
  )
  @ApiQuerySortOptions(FuelSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey') sortKey: FuelSortKeys = FuelSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<FuelSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.fuelService.copyPrint(sortOptions, search);
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get fuels as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Fuel.name),
  )
  @ApiQuerySortOptions(FuelSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: FuelSortKeys = FuelSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<FuelSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.fuelService.generateCsv(sortOptions, search);
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Fuel.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get fuels as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Fuel.name),
  )
  @ApiQuerySortOptions(FuelSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: FuelSortKeys = FuelSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<FuelSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.fuelService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Fuel.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get Fuels as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Fuel.name),
  )
  @ApiQuerySortOptions(FuelSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: FuelSortKeys = FuelSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<FuelSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.fuelService.generatePdf(sortOptions, search);
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Fuel.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
