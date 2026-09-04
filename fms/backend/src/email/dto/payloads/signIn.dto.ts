import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const ResetPasswordEmailSchema = z.object({
  resetPasswordLink: z.string().min(1),
});

export class ResetPasswordEmailDto extends createZodDto(
  ResetPasswordEmailSchema,
) {}
