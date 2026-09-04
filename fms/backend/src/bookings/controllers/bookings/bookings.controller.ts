import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import {
  BookingSortKeys,
  CreateBookingDto,
  UpdateBookingDto,
} from 'src/bookings/dto/booking.dto';
import { Booking } from 'src/bookings/entities/booking.entity';
import { BookingsService } from 'src/bookings/services/bookings/bookings.service';
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

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController extends BaseLogger {
  constructor(private readonly bookingsService: BookingsService) {
    super();
  }

  /**
   * Create a Booking
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Booking)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, Booking.name),
  )
  @Post()
  async create(@Body() createBookingDto: CreateBookingDto) {
    try {
      const data = await this.bookingsService.create(createBookingDto);
      return new APISuccessResponse<Booking>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a Booking
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(Booking)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, Booking.name),
  )
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBookingDto: UpdateBookingDto,
  ) {
    try {
      const data = await this.bookingsService.update(id, updateBookingDto);
      return new APISuccessResponse<Booking>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all Bookings
   */
  @ApiOkResponseGenericPaginated(Booking)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(BookingSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Booking.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey') sortKey: BookingSortKeys = BookingSortKeys.bookingId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<BookingSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.bookingsService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );
      return new APIPaginatedResponse<Booking[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a Booking by id
   */
  @ApiOkResponseGeneric(Booking)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Booking.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.bookingsService.findOne({ id }, [
        'vehicle',
        'driver',
        'client',
      ]);
      return new APISuccessResponse<Booking>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a Booking
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, Booking.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.bookingsService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get bookings for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Booking.name),
  )
  @ApiQuerySortOptions(BookingSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey') sortKey: BookingSortKeys = BookingSortKeys.bookingId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<BookingSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.bookingsService.copyPrint(sortOptions, search);
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get bookings as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Booking.name),
  )
  @ApiQuerySortOptions(BookingSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey')
    sortKey: BookingSortKeys = BookingSortKeys.bookingId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<BookingSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.bookingsService.generateCsv(sortOptions, search);
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Booking.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get booking as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Booking.name),
  )
  @ApiQuerySortOptions(BookingSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: BookingSortKeys = BookingSortKeys.bookingId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<BookingSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.bookingsService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Booking.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get bookings as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, Booking.name),
  )
  @ApiQuerySortOptions(BookingSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: BookingSortKeys = BookingSortKeys.bookingId,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<BookingSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.bookingsService.generatePdf(sortOptions, search);
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - Booking.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
