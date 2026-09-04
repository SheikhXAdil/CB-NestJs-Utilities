import { MemoryStorageFile } from '@blazity/nest-file-fastify';
import { ApiProperty } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { dateFormatRegex } from 'src/common/utilities/formats';

export enum ExpenseSortKeys {
  id = 'id',
  title = 'title',
  amount = 'amount',
  date = 'date',
  note = 'note',
  vehicleName = 'vehicleName',
}

export const ExpenseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  date: z
    .string()
    .min(1)
    .refine(
      (value) => dateFormatRegex.test(value),
      'Date should be of format: DD/MM/YYYY',
    )
    .describe('Date should be of format: DD/MM/YYYY'), // moment object
  receipt: z.string().min(1).describe('file url'),
  note: z.string().optional(),
  vehicleId: z.string().uuid(),
});

export const CreateExpenseSchema = ExpenseSchema.omit({
  id: true,
  receipt: true,
})
  .required()
  .extend({
    note: z.string().optional(),
    vehicleId: z.string().uuid().optional(),
  });

export const UpdateExpenseSchema = CreateExpenseSchema.omit({
  vehicleId: true,
}).partial();

export class ExpenseDto extends createZodDto(ExpenseSchema) {}
export class CreateExpenseDto extends createZodDto(CreateExpenseSchema) {}
export class UpdateExpenseDto extends createZodDto(UpdateExpenseSchema) {}

export class ExpenseFilesUploadDto {
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  receipt: MemoryStorageFile[];
}
