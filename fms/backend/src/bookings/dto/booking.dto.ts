import { createZodDto } from 'nestjs-zod';
import { z } from 'nestjs-zod/z';
import { dateTimeFormatRegex } from 'src/common/utilities/formats';

export enum BookingSortKeys {
  bookingId = 'bookingId',
  vehicleName = 'vehicleName',
  driverName = 'driverName',
  clientName = 'clientName',
  status = 'status',
  paymentStatus = 'paymentStatus',
  startDateTime = 'startDateTime',
}

export enum BookingStatus {
  YetToStart = 'Yet To Start',
  Completed = 'Completed',
  OnGoing = 'On Going',
  Canceled = 'Canceled',
}

export enum BookingPaymentStatus {
  Paid = 'Paid',
  Unpaid = 'Unpaid',
  PartialPaid = 'Partial Paid',
}

export const BookingSchema = z.object({
  id: z.string().uuid(),

  travelerCount: z.coerce.number().nonnegative(),
  approxDistance: z.coerce.number().nonnegative(),
  totalAmount: z.coerce.number().nonnegative(),

  status: z.nativeEnum(BookingStatus),

  startDateTime: z
    .string()
    .min(1)
    .refine(
      (value) => dateTimeFormatRegex.test(value),
      'Date Time should be of format: DD/MM/YYYY HH:mm',
    )
    .describe('Date Time should be of format: DD/MM/YYYY HH:mm'), // moment object
  endDateTime: z
    .string()
    .min(1)
    .refine(
      (value) => dateTimeFormatRegex.test(value),
      'Date Time should be of format: DD/MM/YYYY HH:mm',
    )
    .describe('Date Time should be of format: DD/MM/YYYY HH:mm'), // moment object

  pickUpAddress: z.string().min(1),
  dropOffAddress: z.string().min(1),
  note: z.string(),

  paymentStatus: z.nativeEnum(BookingPaymentStatus),
  paymentNote: z.string(),

  vehicleId: z.string().uuid(),
  driverId: z.string().uuid(),
  clientId: z.string().uuid(),
});

export const CreateBookingSchema = BookingSchema.omit({
  id: true,
})
  .required()
  .extend({
    note: z.string().optional(),
    paymentNote: z.string().optional(),
  });

export const UpdateBookingSchema = CreateBookingSchema.omit({
  vehicleId: true,
  driverId: true,
  clientId: true,
}).partial();

export class BookingDto extends createZodDto(BookingSchema) {}
export class CreateBookingDto extends createZodDto(CreateBookingSchema) {}
export class UpdateBookingDto extends createZodDto(UpdateBookingSchema) {}
