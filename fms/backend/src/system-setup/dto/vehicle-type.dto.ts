import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export enum VehicleTypeSortKeys {
  id = 'id',
  type = 'type',
  note = 'note',
  numberOfSeats = 'numberOfSeats',
}

export const VehicleTypeSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
  numberOfSeats: z.number().nonnegative(),
  note: z.string(),
});

export const CreateVehicleTypeSchema = VehicleTypeSchema.omit({
  id: true,
})
  .required()
  .extend({
    note: z.string().optional(),
  });

export const UpdateVehicleTypeSchema = CreateVehicleTypeSchema.partial();

export class VehicleTypeDto extends createZodDto(VehicleTypeSchema) {}
export class CreateVehicleTypeDto extends createZodDto(
  CreateVehicleTypeSchema,
) {}
export class UpdateVehicleTypeDto extends createZodDto(
  UpdateVehicleTypeSchema,
) {}
