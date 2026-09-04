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
  CreateInspectionTypeDto,
  InspectionTypeSortKeys,
  UpdateInspectionTypeDto,
} from 'src/system-setup/dto/inspection-type.dto';
import { InspectionType } from 'src/system-setup/entities/inspection-type.entity';
import { InspectionTypeService } from 'src/system-setup/services/inspection-type/inspection-type.service';

@ApiTags('System Setup (Inspection Types)')
@Controller('systemSetup/inspectionTypes')
export class InspectionTypeController extends BaseLogger {
  constructor(private readonly inspectionTypeService: InspectionTypeService) {
    super();
  }

  /**
   * Create a inspection Type
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(InspectionType)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, InspectionType.name),
  )
  @Post()
  async create(@Body() createInspectionTypeDto: CreateInspectionTypeDto) {
    try {
      const data = await this.inspectionTypeService.create(
        createInspectionTypeDto,
      );
      return new APISuccessResponse<InspectionType>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a inspection type
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(InspectionType)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, InspectionType.name),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateInspectionTypeDto: UpdateInspectionTypeDto,
  ) {
    try {
      const data = await this.inspectionTypeService.update(
        id,
        updateInspectionTypeDto,
      );
      return new APISuccessResponse<InspectionType>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all inspection Types
   */
  @ApiOkResponseGenericPaginated(InspectionType)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(InspectionTypeSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, InspectionType.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey')
    sortKey: InspectionTypeSortKeys = InspectionTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.inspectionTypeService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<InspectionType[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a inspection Type
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, InspectionType.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.inspectionTypeService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get inspection types for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, InspectionType.name),
  )
  @ApiQuerySortOptions(InspectionTypeSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey')
    sortKey: InspectionTypeSortKeys = InspectionTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.inspectionTypeService.copyPrint(
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
   * Get inspection types as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, InspectionType.name),
  )
  @ApiQuerySortOptions(InspectionTypeSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: InspectionTypeSortKeys = InspectionTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.inspectionTypeService.generateCsv(
        sortOptions,
        search,
      );
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Inspection Type.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get inspection types as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, InspectionType.name),
  )
  @ApiQuerySortOptions(InspectionTypeSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: InspectionTypeSortKeys = InspectionTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.inspectionTypeService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Inspection Type.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get Inspection Types as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, InspectionType.name),
  )
  @ApiQuerySortOptions(InspectionTypeSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: InspectionTypeSortKeys = InspectionTypeSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<InspectionTypeSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.inspectionTypeService.generatePdf(
        sortOptions,
        search,
      );
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Inspection Type.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
