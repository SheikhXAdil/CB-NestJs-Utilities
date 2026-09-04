import {
  Body,
  Controller,
  Get,
  HttpStatus,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../../services/users/users.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ForgetPasswordDto,
  ResetPasswordDto,
  SignInResponseDto,
  UserSignInDto,
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
  APISuccessResponse,
} from 'src/common/classes/BaseResponse';
import { ApiOkResponseGeneric } from 'src/common/decorators/response/generic-responses';
import { getErrorStatusCode } from 'src/common/utilities/err-status';

@ApiTags('Users')
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

      const data = await this.usersService.findOne({ id });
      return new APISuccessResponse<User>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
