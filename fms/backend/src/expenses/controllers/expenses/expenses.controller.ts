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
import {
  CreateExpenseDto,
  ExpenseFilesUploadDto,
  ExpenseSortKeys,
  UpdateExpenseDto,
} from 'src/expenses/dto/expenses.dto';
import { Expense } from 'src/expenses/entities/expense.entity';
import { ExpensesService } from 'src/expenses/services/expenses/expenses.service';
import { DocTypesArr, MaxDocSize } from 'src/files/dto/files.dto';
import { FileValidationPipe } from 'src/files/pipes/files-validation-pipe';

@ApiTags('Expenses')
@Controller('expenses')
export class ExpensesController extends BaseLogger {
  constructor(private readonly expensesService: ExpensesService) {
    super();
  }

  /**
   * Create an expense
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Expense)
  @ApiFileBody(ExpenseFilesUploadDto, CreateExpenseDto)
  @ApiConsumes('multipart/form-data')
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Expense.name),
  )
  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'receipt', maxCount: 1 }]))
  async create(
    @Body() createExpenseDto: CreateExpenseDto,
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
    files: ExpenseFilesUploadDto,
  ) {
    try {
      const data = await this.expensesService.create(createExpenseDto, files);
      return new APISuccessResponse<Expense>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update an expense
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Expense)
  @ApiConsumes('multipart/form-data')
  @ApiFileBody(ExpenseFilesUploadDto, UpdateExpenseDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Expense.name),
  )
  @UseInterceptors(FileFieldsInterceptor([{ name: 'receipt', maxCount: 1 }]))
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
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
    files: ExpenseFilesUploadDto,
  ) {
    try {
      const data = await this.expensesService.update(
        id,
        updateExpenseDto,
        files,
      );
      return new APISuccessResponse<Expense>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Expenses
   */
  @ApiOkResponseGenericPaginated(Expense)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(ExpenseSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Expense.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey') sortKey: ExpenseSortKeys = ExpenseSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.expensesService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<Expense[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get an expense by id
   */
  @ApiOkResponseGeneric(Expense)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Expense.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.expensesService.findOne({ id }, ['vehicle']);
      return new APISuccessResponse<Expense>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete an expense
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Expense.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.expensesService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get expenses for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Expense.name),
  )
  @ApiQuerySortOptions(ExpenseSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey') sortKey: ExpenseSortKeys = ExpenseSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.expensesService.copyPrint(sortOptions, search);
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get expenses as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Expense.name),
  )
  @ApiQuerySortOptions(ExpenseSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: ExpenseSortKeys = ExpenseSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.expensesService.generateCsv(sortOptions, search);
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Expense.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get expense as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Expense.name),
  )
  @ApiQuerySortOptions(ExpenseSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: ExpenseSortKeys = ExpenseSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.expensesService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Expense.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get Expenses as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Expense.name),
  )
  @ApiQuerySortOptions(ExpenseSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: ExpenseSortKeys = ExpenseSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<ExpenseSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.expensesService.generatePdf(sortOptions, search);
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Expense.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
