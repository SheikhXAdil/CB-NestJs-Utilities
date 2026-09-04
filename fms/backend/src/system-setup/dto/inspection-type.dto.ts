import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export enum InspectionTypeSortKeys {
  id = 'id',
  type = 'type',
}

export const InspectionTypeSchema = z.object({
  id: z.string().uuid(),
  type: z.string().min(1),
});

export const CreateInspectionTypeSchema = InspectionTypeSchema.omit({
  id: true,
});

export const UpdateInspectionTypeSchema = CreateInspectionTypeSchema.partial();

export class InspectionTypeDto extends createZodDto(InspectionTypeSchema) {}
export class CreateInspectionTypeDto extends createZodDto(
  CreateInspectionTypeSchema,
) {}
export class UpdateInspectionTypeDto extends createZodDto(
  UpdateInspectionTypeSchema,
) {}
