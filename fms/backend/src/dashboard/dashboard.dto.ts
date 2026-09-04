import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';

export const DashboardTotalsResSchema = z.object({
  totalClient: z.number(),
  totalBooking: z.number(),
  totalIncome: z.number(),
  totalExpense: z.number(),
});

export const IncomeExpenseMonthlyReportObjSchema = z.object({
  income: z.number(),
  expense: z.number(),
});

export const DashboardIncomeExpenseMonthlyReportResSchema = z.object({
  January: IncomeExpenseMonthlyReportObjSchema,
  February: IncomeExpenseMonthlyReportObjSchema,
  March: IncomeExpenseMonthlyReportObjSchema,
  April: IncomeExpenseMonthlyReportObjSchema,
  May: IncomeExpenseMonthlyReportObjSchema,
  June: IncomeExpenseMonthlyReportObjSchema,
  July: IncomeExpenseMonthlyReportObjSchema,
  August: IncomeExpenseMonthlyReportObjSchema,
  September: IncomeExpenseMonthlyReportObjSchema,
  October: IncomeExpenseMonthlyReportObjSchema,
  November: IncomeExpenseMonthlyReportObjSchema,
  December: IncomeExpenseMonthlyReportObjSchema,
});

export class DashboardTotalsResDto extends createZodDto(
  DashboardTotalsResSchema,
) {}
export class IncomeExpenseMonthlyReportObjDto extends createZodDto(
  IncomeExpenseMonthlyReportObjSchema,
) {}
export class DashboardIncomeExpenseMonthlyReportResDto extends createZodDto(
  DashboardIncomeExpenseMonthlyReportResSchema,
) {}
