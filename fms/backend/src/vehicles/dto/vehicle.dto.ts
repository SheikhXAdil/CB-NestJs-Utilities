import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { dateFormatRegex } from 'src/common/utilities/formats';

export enum VehicleSortKeys {
  vehicleId = 'vehicleId',
  name = 'name',
  type = 'type',
  model = 'model',
  licensePlate = 'licensePlate',
  engineType = 'engineType',
  registrationExpiryDate = 'registrationExpiryDate',
}

export const VehicleSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  name: z.string().min(1),
  model: z.string().min(1),
  engineNumber: z.string().min(1),
  engineType: z.string().min(1),
  licensePlate: z.string().min(1),
  color: z.string().min(1),
  registrationExpiryDate: z
    .string()
    .min(1)
    .refine(
      (value) => dateFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY',
    )
    .describe('Date should be of format: DD/MM/YYYY'), // moment object
  document: z.string().min(1).describe('file url'),
  note: z.string(),
});

export const CreateVehicleSchema = VehicleSchema.omit({
  id: true,
  document: true,
}).required();
export const UpdateVehicleSchema = CreateVehicleSchema.partial();

export class VehicleDto extends createZodDto(VehicleSchema) {}
export class CreateVehicleDto extends createZodDto(CreateVehicleSchema) {}
export class UpdateVehicleDto extends createZodDto(UpdateVehicleSchema) {}

export class VehicleFilesUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  document: MemoryStorageFile[];
}
