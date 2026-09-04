import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { Gender } from 'src/common/enums/gender';
import { phoneNumberFormatRegex } from 'src/common/utilities/formats';

export enum ClientSortKeys {
  clientId = 'clientId',
  name = 'name',
  email = 'email',
  phoneNumber = 'phoneNumber',
  address = 'address',
}

// Define the schema for the Client
export const ClientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1), // Client Name
  email: z.string().email(), // Client Email
  phoneNumber: z
    .string()
    .min(1)
    .refine(
      (value) => phoneNumberFormatRegex.test(value),
      'Invalid phone number',
    )
    .describe('Phone number should have a proper format'), // Client Phone Number
  gender: z.nativeEnum(Gender), // Client Gender
  country: z.string().min(1), // Client Country
  state: z.string().min(1), // Client State
  city: z.string().min(1), // Client City
  zipCode: z.string().min(1), // Client Zip Code
  address: z.string().min(1), // Client Address
  note: z.string(), // Client Note
});

// Create the DTO from the schema
export class ClientDto extends createZodDto(ClientSchema) {}

// Re-export other DTOs for modular usage
export * from './create-client.dto';
export * from './update-client.dto';
