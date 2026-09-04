import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema, UserSchema } from './user.dto';

export const UpdateUserSchema = CreateUserSchema.partial();

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}
