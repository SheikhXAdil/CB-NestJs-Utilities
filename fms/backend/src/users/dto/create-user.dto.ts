import { createZodDto } from 'nestjs-zod';
import { UserSchema } from './user.dto';

export const CreateUserSchema = UserSchema.pick({
  email: true,
  password: true,
  phoneNumber: true,
  assignedRole: true,
  name: true,
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
