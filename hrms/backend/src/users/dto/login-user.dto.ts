import { z } from 'nestjs-zod/z';
import { UserSchema } from './user.dto';
import { createZodDto } from 'nestjs-zod';

export const UserSignInSchema = UserSchema.pick({
  email: true,
  password: true,
});

export const ResetPasswordSchema = UserSchema.pick({
  id: true,
  passwordResetToken: true,
  password: true,
});

export const ForgetPasswordSchema = UserSchema.pick({
  email: true,
});

export const SignInResponseSchema = z.object({
  accessToken: z.string(),
  userId: z.string(),
});

export class UserSignInDto extends createZodDto(UserSignInSchema) {}
export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
export class ForgetPasswordDto extends createZodDto(ForgetPasswordSchema) {}
export class SignInResponseDto extends createZodDto(SignInResponseSchema) {}
