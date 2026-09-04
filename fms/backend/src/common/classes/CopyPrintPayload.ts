import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const PrintCopyDataResSchema = z.object({
  exportData: z.string(),
  rowCount: z.number(),
});

export class PrintCopyDataResDto extends createZodDto(PrintCopyDataResSchema) {}
