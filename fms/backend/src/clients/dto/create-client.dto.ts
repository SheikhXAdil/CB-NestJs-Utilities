import { createZodDto } from 'nestjs-zod';
import { ClientSchema } from './client.dto';
import { z } from 'nestjs-zod/z';

// Define the schema for creating a new client
export const CreateClientSchema = ClientSchema.omit({
  id: true,
})
  .required()
  .extend({
    note: z.string().optional(),
  });

// Create the DTO from the schema
export class CreateClientDto extends createZodDto(CreateClientSchema) {}
