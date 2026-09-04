import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { dateTimeFormatRegex } from 'src/common/utilities/formats';

export enum FuelSortKeys {
  id = 'id',
  vehicleName = 'vehicleName',
  driverName = 'driverName',
  meterReading = 'meterReading',
  totalAmount = 'totalAmount',
  totalQuantity = 'totalQuantity',
  fuelLocation = 'fuelLocation',
  dateTime = 'dateTime',
}

export const FuelSchema = z.object({
  id: z.string().uuid(),
  totalAmount: z.coerce.number().nonnegative(),
  totalQuantity: z.coerce.number().nonnegative(),
  meterReading: z.coerce.number().nonnegative(),
  fuelLocation: z.string().min(1),
  dateTime: z
    .string()
    .min(1)
    .refine(
      (value) => dateTimeFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY HH:mm',
    )
    .describe('Date should be of format: DD/MM/YYYY HH:mm'), // moment object
  receipt: z.string().min(1).describe('file url'),
  note: z.string(),
  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
});

export const CreateFuelSchema = FuelSchema.omit({
  id: true,
  receipt: true,
})
  .required()
  .extend({
    note: z.string().optional(),
    driverId: z.string().uuid().optional(),
  });

export const UpdateFuelSchema = CreateFuelSchema.omit({
  vehicleId: true,
  driverId: true,
}).partial();

export class FuelDto extends createZodDto(FuelSchema) {}
export class CreateFuelDto extends createZodDto(CreateFuelSchema) {}
export class UpdateFuelDto extends createZodDto(UpdateFuelSchema) {}

export class FuelFilesUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  receipt: MemoryStorageFile[];
}
