import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import {
  dateFormatRegex,
  dateTimeFormatRegex,
} from 'src/common/utilities/formats';

export enum VehicleInspectionSortKeys {
  id = 'id',
  inspectionVehicleName = 'inspectionVehicleName',
  inspectionByName = 'inspectionByName',
  inspectionDate = 'inspectionDate',
  repairStatus = 'repairStatus',
  inspectionStatus = 'inspectionStatus',
}

export enum VehicleInspectionStatus {
  Pending = 'Pending',
  Completed = 'Completed',
  InProgress = 'In Progress',
  Rejected = 'Rejected',
  OnHold = 'On Hold',
  ConditionalPass = 'Conditional Pass',
}

export enum VehicleRepairStatus {
  NeedsRepair = 'Needs Repair',
  Completed = 'Completed',
  Pending = 'Pending',
  OnHold = 'On Hold',
  InProgress = 'In Progress',
}

export enum VehicleFuelReading {
  '1/4' = '1/4',
  '1/2' = '1/2',
  '3/4' = '3/4',
  FullTank = 'Full Tank',
}

export const InspectionChecklistSchema = z.array(
  z.object({
    type: z.string().min(1),
    check: z.boolean().default(false),
    note: z.string().default(''),
  }),
);

export const VehicleInspectionSchema = z.object({
  id: z.string().uuid(),
  inspectionStatus: z.nativeEnum(VehicleInspectionStatus),
  repairStatus: z.nativeEnum(VehicleRepairStatus),
  inspectionDate: z
    .string()
    .min(1)
    .refine(
      (value) => dateFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY',
    )
    .describe('Date should be of format: DD/MM/YYYY'), // moment object
  note: z.string(),

  inspectionChecklist: InspectionChecklistSchema,

  // ongoing details
  ongoingDateTime: z
    .string()
    .min(1)
    .refine(
      (value) => dateTimeFormatRegex.test(value),
      'Date Time should be of format: DD/MM/YYYY HH:mm',
    )
    .describe('Date Time should be of format: DD/MM/YYYY HH:mm'), // moment object,
  ongoingMeterReading: z.number().nonnegative(),
  ongoingFuelReading: z.nativeEnum(VehicleFuelReading),

  // incoming details
  incomingDateTime: z
    .string()
    .min(1)
    .refine(
      (value) => dateTimeFormatRegex.test(value),
      'Date Time should be of format: DD/MM/YYYY HH:mm',
    )
    .describe('Date Time should be of format: DD/MM/YYYY HH:mm'), // moment object,
  incomingMeterReading: z.number().nonnegative(),
  incomingFuelReading: z.nativeEnum(VehicleFuelReading),

  // relations
  inspectionVehicleId: z.string().uuid(),
  inspectionById: z.string().uuid(),
});

export const CreateVehicleInspectionSchema = VehicleInspectionSchema.omit({
  id: true,
});

export const UpdateVehicleInspectionSchema = CreateVehicleInspectionSchema.omit(
  {
    inspectionVehicleId: true,
    inspectionById: true,
  },
).partial();

export class VehicleInspectionDto extends createZodDto(
  VehicleInspectionSchema,
) {}
export class CreateVehicleInspectionDto extends createZodDto(
  CreateVehicleInspectionSchema,
) {}
export class UpdateVehicleInspectionDto extends createZodDto(
  UpdateVehicleInspectionSchema,
) {}

export class InspectionChecklistDto extends createZodDto(
  InspectionChecklistSchema,
) {}
