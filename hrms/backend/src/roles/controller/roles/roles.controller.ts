import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Action } from 'src/casl/casl-ability.factory/actions.enum';
import { CoreAppAbility } from 'src/casl/casl-ability.factory/casl-ability.factory';
import { BaseLogger } from 'src/common/classes/BaseLogger';
import {
  APIFailureResponse,
  APISuccessResponse,
} from 'src/common/classes/BaseResponse';
import {
  ApiOkResponseGeneric,
  ApiOkResponseGenericArray,
} from 'src/common/decorators/response/generic-responses';
import {
  CheckPolicies,
  PoliciesGuard,
} from 'src/common/guards/policy-guard/policyGuard';
import { getErrorStatusCode } from 'src/common/utilities/err-status';
import { Role } from 'src/roles/entities/role.entity';
import { RolesService } from 'src/roles/services/roles/roles.service';

@ApiTags('Roles')
@Controller('roles')
export class RolesController extends BaseLogger {
  constructor(private readonly rolesService: RolesService) {
    super();
  }

  /**
   * Get all roles
   */
  @ApiOkResponseGenericArray(Role)
  @Get()
  async findAll() {
    try {
      const data = await this.rolesService.findAll();
      return new APISuccessResponse<Role[]>(data);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Get a role by roleName
   */
  @ApiOkResponseGeneric(Role)
  @Get(':roleName')
  async findOne(@Param('roleName') roleName: string) {
    try {
      const data = await this.rolesService.findOne(roleName);
      return new APISuccessResponse<Role>(data);
    } catch (err) {
      this.logError('findOne', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }

  /**
   * Delete a role
   */
  @ApiOkResponseGeneric(Object)
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), PoliciesGuard)
  @CheckPolicies((ability: CoreAppAbility) =>
    ability.can(Action.Manage, Role.name),
  )
  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      await this.rolesService.remove(id);
      return new APISuccessResponse({});
    } catch (err) {
      this.logError('remove', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
