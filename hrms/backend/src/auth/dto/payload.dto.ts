import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const AccessTokenPayloadSchema = z.object({
  email: z.string().email().optional(),
  id: z.string().uuid(),
});

export class AccessTokenPayloadDto extends createZodDto(
  AccessTokenPayloadSchema,
) {}
