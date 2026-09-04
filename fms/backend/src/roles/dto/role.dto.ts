import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PermissionSchema } from './permission.dto';

export enum RoleSortKeys {
  id = 'id',
  roleName = 'roleName',
  assignedPermissionsCount = 'assignedPermissionsCount',
  assignedUsersCount = 'assignedUsersCount',
}

export const RoleSchema = z.object({
  id: z.string().min(1),
  roleName: z.string().min(1),
  assignedPermissionsCount: z.number().nonnegative(),
  assignedUsersCount: z.number().nonnegative(),
  permissions: z.array(
    PermissionSchema.pick({
      entity: true,
      permission: true,
    }),
  ),
});

export const CreateRoleSchema = RoleSchema.omit({
  id: true,
  assignedPermissionsCount: true,
  assignedUsersCount: true,
}).required();

export const UpdateRoleSchema = CreateRoleSchema.partial();

export class RoleDto extends createZodDto(RoleSchema) {}
export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
