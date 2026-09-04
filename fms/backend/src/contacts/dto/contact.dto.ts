import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { phoneNumberFormatRegex } from 'src/common/utilities/formats';

export const ContactSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  contactNumber: z
    .string()
    .min(1)
    .refine(
      (value) => phoneNumberFormatRegex.test(value),
      'Invalid contact number',
    )
    .describe('Contact number should have a proper format'),
  subject: z.string(),
  message: z.string(),
});

export const CreateContactSchema = ContactSchema.omit({
  id: true,
});

export const UpdateContactSchema = CreateContactSchema.partial();

export class ContactDto extends createZodDto(ContactSchema) {}
export class CreateContactDto extends createZodDto(CreateContactSchema) {}
export class UpdateContactDto extends createZodDto(UpdateContactSchema) {}
