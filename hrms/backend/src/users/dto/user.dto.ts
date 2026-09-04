import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(2),
  passwordResetToken: z.string().min(2),
  lastLoginAt: z.date(),
});

export class UserDto extends createZodDto(UserSchema) {}

export * from './create-user.dto';
export * from './update-user.dto';
export * from './login-user.dto';
