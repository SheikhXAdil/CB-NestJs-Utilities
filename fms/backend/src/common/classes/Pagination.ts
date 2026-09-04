import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PaginationMetaSchema = z.object({
  itemCount: z.number().nonnegative(),
  totalItems: z.number().nonnegative().optional(),
  itemsPerPage: z.number().nonnegative(),
  totalPages: z.number().nonnegative().optional(),
  currentPage: z.number().nonnegative(),
});

export class PaginationMetaClass extends createZodDto(PaginationMetaSchema) {}
