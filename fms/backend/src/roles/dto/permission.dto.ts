import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PermissionSchema = z.object({
  id: z.string().min(1),
  permission: z.string().min(1),
  entity: z.string().min(1),
  visibility: z.boolean(),
});

export const CreatePermissionSchema = PermissionSchema.omit({
  id: true,
}).required();

export const updatePermissionSchema = CreatePermissionSchema.partial();

export class PermissionDto extends createZodDto(PermissionSchema) {}
export class CreatePermissionDto extends createZodDto(CreatePermissionSchema) {}
export class updatePermissionDto extends createZodDto(updatePermissionSchema) {}
