import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BaseLogger } from 'src/common/classes/BaseLogger';
import {
  APIFailureResponse,
  APISuccessResponse,
} from 'src/common/classes/BaseResponse';
import { ApiOkResponseGenericArray } from 'src/common/decorators/response/generic-responses';
import { getErrorStatusCode } from 'src/common/utilities/err-status';
import { Permission } from 'src/roles/entities/permission.entity';
import { PermissionsService } from 'src/roles/services/permissions/permissions.service';

@ApiTags('Permissions')
@Controller('permissions')
export class PermissionsController extends BaseLogger {
  constructor(private readonly permissionsService: PermissionsService) {
    super();
  }

  /**
   * Get all permissions
   */
  @ApiOkResponseGenericArray(Permission)
  @Get()
  async findAll() {
    try {
      const data = await this.permissionsService.findAll({ visibility: true });
      return new APISuccessResponse<Permission[]>(data);
    } catch (err) {
      this.logError('findAll', err.message);
      return new APIFailureResponse(getErrorStatusCode(err), err.message);
    }
  }
}
