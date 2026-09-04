import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { dateFormatRegex } from 'src/common/utilities/formats';

export enum VehicleServiceSortKeys {
  id = 'id',
  status = 'status',
  totalAmount = 'totalAmount',
  startDate = 'startDate',
  endDate = 'endDate',
  attachment = 'attachment',
  vehicleName = 'vehicleName',
}

export enum VehicleServiceStatus {
  Scheduled = 'Scheduled',
  Completed = 'Completed',
  Canceled = 'Canceled',
  OnHold = 'On Hold',
  InProgress = 'In Progress',
}

export const VehicleServiceSchema = z.object({
  id: z.string().uuid(),
  totalAmount: z.coerce.number().nonnegative(),
  status: z.nativeEnum(VehicleServiceStatus),
  startDate: z
    .string()
    .min(1)
    .refine(
      (value) => dateFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY',
    )
    .describe('Date should be of format: DD/MM/YYYY'), // moment object
  endDate: z
    .string()
    .min(1)
    .refine(
      (value) => dateFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY',
    )
    .describe('Date should be of format: DD/MM/YYYY'), // moment object
  attachment: z.string(), // file url
  note: z.string(),
  vehicleId: z.string().uuid(),
});

export const CreateVehicleServiceSchema = VehicleServiceSchema.omit({
  id: true,
  attachment: true,
})
  .required()
  .extend({
    note: z.string().optional(),
  });

export const UpdateVehicleServiceSchema = CreateVehicleServiceSchema.omit({
  vehicleId: true,
}).partial();

export class VehicleServiceDto extends createZodDto(VehicleServiceSchema) {}
export class CreateVehicleServiceDto extends createZodDto(
  CreateVehicleServiceSchema,
) {}
export class UpdateVehicleServiceDto extends createZodDto(
  UpdateVehicleServiceSchema,
) {}

export class VehicleServiceFilesUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  attachment: MemoryStorageFile[];
}
