import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const RoleSchema = z.object({
  id: z.string().min(2),
  roleName: z.string().min(2),
});

export const CreateRoleSchema = RoleSchema.omit({
  id: true,
}).required();

export enum RoleEnum {
  employee = 'employee',
}

export class RoleDto extends createZodDto(RoleSchema) {}
export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
