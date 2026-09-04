import { createZodDto } from 'nestjs-zod';
import { CreateClientSchema, ClientSchema } from './client.dto';

export const UpdateClientSchema = CreateClientSchema.partial();

export class UpdateClientDto extends createZodDto(UpdateClientSchema) {}
