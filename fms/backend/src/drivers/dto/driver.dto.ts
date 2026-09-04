import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { Gender } from 'src/common/enums/gender';
import {
  dateFormatRegex,
  phoneNumberFormatRegex,
} from 'src/common/utilities/formats';

export enum DriverSortKeys {
  driverId = 'driverId',
  name = 'name',
  email = 'email',
  phoneNumber = 'phoneNumber',
  licenseNumber = 'licenseNumber',
  issueDate = 'issueDate',
  expirationDate = 'expirationDate',
}

export const DriverSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().min(1).email(),
  phoneNumber: z
    .string()
    .min(1)
    .refine(
      (value) => phoneNumberFormatRegex.test(value),
      'Invalid phone number',
    )
    .describe('Phone number should have a proper format'),
  gender: z.nativeEnum(Gender),
  age: z.coerce.number().nonnegative(),
  joiningDate: z
    .string()
    .min(1)
    .refine(
      (value) => dateFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY',
    )
    .describe('Date should be of format: DD/MM/YYYY'), // moment object
  address: z.string().min(1),
  licenseNumber: z.string().min(1),
  issueDate: z
    .string()
    .min(1)
    .refine(
      (value) => dateFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY',
    )
    .describe('Date should be of format: DD/MM/YYYY'), // moment object
  expirationDate: z
    .string()
    .min(1)
    .refine(
      (value) => dateFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY',
    )
    .describe('Date should be of format: DD/MM/YYYY'), // moment object
  document: z.string().min(1).describe('file url'),
  license: z.string().min(1).describe('file url'),
  reference: z.string(),
  note: z.string(),
});

export const CreateDriverSchema = DriverSchema.omit({
  id: true,
  document: true,
  license: true,
})
  .required()
  .extend({
    note: z.string().optional(),
    reference: z.string().optional(),
  });
export const UpdateDriverSchema = CreateDriverSchema.partial();

export class DriverDto extends createZodDto(DriverSchema) {}
export class CreateDriverDto extends createZodDto(CreateDriverSchema) {}
export class UpdateDriverDto extends createZodDto(UpdateDriverSchema) {}

export class DriverFilesUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  license: MemoryStorageFile[];

  @ApiProperty({ type: 'string', format: 'binary', required: false })
  document: MemoryStorageFile[];
}
