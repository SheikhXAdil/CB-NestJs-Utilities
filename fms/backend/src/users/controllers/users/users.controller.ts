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
import { UsersService } from '../../services/users/users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  CreateUserDto,
  ForgetPasswordDto,
  ResetPasswordDto,
  SignInResponseDto,
  UpdateUserDto,
  UserSignInDto,
  UserSortKeys,
} from 'src/users/dto/user.dto';
import { BaseLogger } from 'src/common/classes/BaseLogger';
import { AuthGuard } from '@nestjs/passport';
import {
  CheckPolicies,
  PoliciesGuard,
} from 'src/common/guards/policy-guard/policyGuard';
import { CoreAppAbility } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { User } from 'src/users/entities/user.entity';
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
  ApiOkResponseGenericPaginated,
  ApiOkResponsePdf,
} from 'src/common/decorators/response/generic-responses';
import { getErrorStatusCode } from 'src/common/utilities/err-status';
import { ApiPaginatedQueryOptions } from 'src/common/decorators/query/swagger-pagination-options';
import { PositiveNumericQueryParamValidationPipe } from 'src/common/pipes/numeric-string-validation.pipe';
import { IPaginationOptions } from 'nestjs-typeorm-paginate';
import {
  ApiQuerySortOptions,
  ApiSearchQueryParam,
} from 'src/common/decorators/query/swagger-sort-search';
import { SortOptions, SortOrder } from 'src/common/classes/Sorting';
import { PrintCopyDataResDto } from 'src/common/classes/CopyPrintPayload';
import { FastifyReply } from 'fastify';

@ApiTags('User')
@Controller('users')
export class UsersController extends BaseLogger {
  constructor(private readonly usersService: UsersService) {
    super();
  }

  /**
   * signIn route
   */
  @ApiOkResponseGeneric(SignInResponseDto)
  @Post('/auth/signIn')
  async signIn(
    @Body()
    userSignInDto: UserSignInDto,
  ) {
    try {
      const data = await this.usersService.signIn(userSignInDto);
      return new APISuccessResponse<SignInResponseDto>(data);
    } catch (err) {
      this.logError('signIn', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Forget Password
   */
  @ApiOkResponseGeneric(Object)
  @Post('/auth/forgetPassword')
  async forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    try {
      await this.usersService.forgetPassword(forgetPasswordDto);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('forgetPassword', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Reset Password
   */
  @ApiOkResponseGeneric(Object)
  @Patch('/auth/resetPassword')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.usersService.resetPassword(resetPasswordDto);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('resetPassword', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get user own data
   */
  @ApiOkResponseGeneric(User)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Get('/me')
  async getUserOwnData(@Req() req) {
    try {
      const id = req.user.id;

      const data = await this.usersService.findOne({ id }, ['roles']);
      return new APISuccessResponse<User>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Create a user
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(User)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Create, User.name),
  )
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      const data = await this.usersService.create(createUserDto);
      return new APISuccessResponse<User>(data);
    } catch (err) {
      this.logError('create', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * update a user
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(User)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Edit, User.name),
  )
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      const data = await this.usersService.update(id, updateUserDto);
      return new APISuccessResponse<User>(data);
    } catch (err) {
      this.logError('update', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get all users
   */
  @ApiOkResponseGenericPaginated(User)
  @ApiPaginatedQueryOptions()
  @ApiQuerySortOptions(UserSortKeys)
  @ApiSearchQueryParam()
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, User.name),
  )
  @Get()
  async findAll(
    @Query('page', PositiveNumericQueryParamValidationPipe) page: string = '1',
    @Query('limit', PositiveNumericQueryParamValidationPipe)
    limit: string = '10',
    @Query('sortKey') sortKey: UserSortKeys = UserSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const paginationOptions: IPaginationOptions = {
      page,
      limit,
    };

    const sortOptions: SortOptions<UserSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.usersService.findAll(
        paginationOptions,
        sortOptions,
        search,
      );

      return new APIPaginatedResponse<User[]>(data.items, data.meta);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a user by id
   */
  @ApiOkResponseGeneric(User)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, User.name),
  )
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const data = await this.usersService.findOne({ id }, ['roles']);
      return new APISuccessResponse<User>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a user
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Delete, User.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.usersService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get users for copy to clipboard or printing
   */
  @ApiBearerAuth()
  @ApiOkResponseGeneric(PrintCopyDataResDto)
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, User.name),
  )
  @ApiQuerySortOptions(UserSortKeys)
  @ApiSearchQueryParam()
  @Get('export/text')
  async copyPrint(
    @Query('sortKey') sortKey: UserSortKeys = UserSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<UserSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.usersService.copyPrint(sortOptions, search);
      return new APISuccessResponse<PrintCopyDataResDto>(data);
    } catch (err) {
      this.logError('copyPrint', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get users as csv
   */
  @ApiBearerAuth()
  @ApiOkResponseCsv()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, User.name),
  )
  @ApiQuerySortOptions(UserSortKeys)
  @ApiSearchQueryParam()
  @Get('export/csv')
  async generateCsv(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: UserSortKeys = UserSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<UserSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.usersService.generateCsv(sortOptions, search);
      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - User.csv"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateCsv', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get user as excel
   */
  @ApiBearerAuth()
  @ApiOkResponseExcel()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, User.name),
  )
  @ApiQuerySortOptions(UserSortKeys)
  @ApiSearchQueryParam()
  @Get('export/excel')
  async generateExcelFile(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: UserSortKeys = UserSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<UserSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.usersService.generateExcelFile(
        sortOptions,
        search,
      );
      res.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - User.xlsx"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generateExcelFile', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get users as pdf
   */
  @ApiBearerAuth()
  @ApiOkResponsePdf()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Show, User.name),
  )
  @ApiQuerySortOptions(UserSortKeys)
  @ApiSearchQueryParam()
  @Get('export/pdf')
  async generatePdf(
    @Res() res: FastifyReply,
    @Query('sortKey') sortKey: UserSortKeys = UserSortKeys.id,
    @Query('sortOrder') sortOrder: SortOrder = 'ASC',
    @Query('search') search,
  ) {
    const sortOptions: SortOptions<UserSortKeys> = {
      sortKey,
      sortOrder,
    };

    try {
      const data = await this.usersService.generatePdf(sortOptions, search);
      res.header('Content-Type', 'application/pdf');
      res.header(
        'Content-Disposition',
        'attachment; filename="Smart Fleet SaaS - User.pdf"',
      );
      res.send(data);
    } catch (err) {
      this.logError('generatePdf', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
