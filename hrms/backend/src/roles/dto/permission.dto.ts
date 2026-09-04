import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PermissionSchema = z.object({
  id: z.string().min(2),
  permission: z.string().min(2),
  entity: z.string().min(2),
});

export const CreatePermissionSchema = PermissionSchema.omit({
  id: true,
}).required();

export class PermissionDto extends createZodDto(PermissionSchema) {}
export class CreatePermissionDto extends createZodDto(CreatePermissionSchema) {}
