import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { phoneNumberFormatRegex } from 'src/common/utilities/formats';

export enum UserSortKeys {
  id = 'id',
  email = 'email',
  phoneNumber = 'phoneNumber',
  name = 'name',
  assignedRole = 'assignedRole',
}

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password: z.string().min(1),
  assignedRole: z.string().min(1),
  phoneNumber: z
    .string()
    .min(1)
    .refine(
      (value) => phoneNumberFormatRegex.test(value),
      'Invalid phone number',
    )
    .describe('Phone number should have a proper format'),
  name: z.string().min(1),
  passwordResetToken: z.string().min(1),
  lastLoginAt: z.any(), // moment object
});

export class UserDto extends createZodDto(UserSchema) {}

export * from './create-user.dto';
export * from './update-user.dto';
export * from './login-user.dto';
