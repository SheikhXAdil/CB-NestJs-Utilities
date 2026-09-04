import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ClientsService } from '../../services/clients/clients.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ClientSortKeys,
  CreateClientDto,
  UpdateClientDto,
} from 'src/clients/dto/client.dto';
import { BaseLogger } from 'src/common/classes/BaseLogger';
import { AuthGuard } from '@nestjs/passport';
import {
  CheckPolicies,
  PoliciesGuard,
} from 'src/common/guards/policy-guard/policyGuard';
import { CoreAppAbility } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { Client } from 'src/clients/entities/client.entity';
import { Action } from 'src/casl/casl-ability.factory/actions.enum';
import {
  APIFailureResponse,
  APIPaginatedResponse,
  APISuccessResponse,
} from 'src/common/classes/BaseResponse';
import {
  ApiOkResponseCsv,
  ApiOkResponseExcel,
  ApiOkResponseGeneric,
  ApiOkResponseGenericArray,
  ApiOkResponseGenericPaginated,
  ApiOkResponsePdf,
} from 'src/common/decorators/response/generic-responses';
import { getErrorStatusCode } from 'src/common/utilities/err-status';
import { ApiPaginatedQueryOptions } from 'src/common/decorators/query/swagger-pagination-options';
import { PositiveNumericQueryParamValidationPipe } from 'src/common/pipes/numeric-string-validation.pipe';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import { SortOptions, SortOrder } from 'src/common/classes/Sorting';
import {
  ApiQuerySortOptions,
  ApiSearchQueryParam,
} from 'src/common/decorators/query/swagger-sort-search';
import { PrintCopyDataResDto } from 'src/common/classes/CopyPrintPayload';
import { FastifyReply } from 'fastify';

@ApiTags('Client')
@Controller('clients')
export class ClientsController extends BaseLogger {
  constructor(private readonly clientsService: ClientsService) {
    super();
  }

  /**
   * Create a client
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Client)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Client.name),
  )
  @Post()
  async create(@Body() createClientDto: CreateClientDto) {
    try {
      const data = await this.clientsService.createClient(createClientDto);
      return new APISuccessResponse<Client>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Update a client
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Client)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Client.name),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    try {
      const data = await this.clientsService.updateClient(id, updateClientDto);
      return new APISuccessResponse<Client>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all clients
   */
  @ApiOkResponseGenericPaginated(Client)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(ClientSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Client.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey') sortKey: ClientSortKeys = ClientSortKeys.clientId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<ClientSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.clientsService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<Client[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a client by id
   */
  @ApiOkResponseGeneric(Client)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Client.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.clientsService.findOne({ id });
      return new APISuccessResponse<Client>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a client
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Client.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.clientsService.deleteClient(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get clients for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Client.name),
  )
  @ApiQuerySortOptions(ClientSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey') sortKey: ClientSortKeys = ClientSortKeys.clientId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<ClientSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.clientsService.copyPrint(sortOptions, search);
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get clients as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Client.name),
  )
  @ApiQuerySortOptions(ClientSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: ClientSortKeys = ClientSortKeys.clientId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<ClientSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.clientsService.generateCsv(sortOptions, search);
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Client.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get clients as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Client.name),
  )
  @ApiQuerySortOptions(ClientSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: ClientSortKeys = ClientSortKeys.clientId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<ClientSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.clientsService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Client.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get clients as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Client.name),
  )
  @ApiQuerySortOptions(ClientSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: ClientSortKeys = ClientSortKeys.clientId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<ClientSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.clientsService.generatePdf(sortOptions, search);
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Client.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
