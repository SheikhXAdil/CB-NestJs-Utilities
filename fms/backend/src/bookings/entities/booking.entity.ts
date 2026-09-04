import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';
import { Driver } from 'src/drivers/entities/driver.entity';
import { Client } from 'src/clients/entities/client.entity';
import { BookingPaymentStatus, BookingStatus } from '../dto/booking.dto';

@Entity({ name: 'bookings' })
export class Booking extends SoftDeleteEntity {
  @ApiProperty({ description: 'booking ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'booking readable number/id',
  })
  @Column({ type: 'text', nullable: true })
  bookingId: string;

  @ApiProperty({
    description: 'booking total Amount',
  })
  @Column({ type: 'float', nullable: false, default: 0 })
  totalAmount: number;

  @ApiProperty({
    description: 'booking traveler count',
  })
  @Column({ type: 'float', nullable: false, default: 0 })
  travelerCount: number;

  @ApiProperty({
    description: 'booking approx distance in km',
  })
  @Column({ type: 'float', nullable: false, default: 0 })
  approxDistance: number;

  @ApiProperty({
    description: 'booking status',
  })
  @Column({ type: 'text', nullable: true })
  status: BookingStatus;

  @ApiProperty({
    description: 'booking startDateTime',
  })
  @Column({ type: 'timestamptz', nullable: true })
  startDateTime: moment.Moment;

  @ApiProperty({
    description: 'booking endDateTime',
  })
  @Column({ type: 'timestamptz', nullable: true })
  endDateTime: moment.Moment;

  @ApiProperty({
    description: 'booking pickup address',
  })
  @Column({ type: 'text', nullable: true })
  pickUpAddress: string;

  @ApiProperty({
    description: 'booking drop off address',
  })
  @Column({ type: 'text', nullable: true })
  dropOffAddress: string;

  @ApiProperty({
    description: 'booking notes',
  })
  @Column({ type: 'text', nullable: true })
  note: string;

  @ApiProperty({
    description: 'booking status',
  })
  @Column({ type: 'text', nullable: true })
  paymentStatus: BookingPaymentStatus;

  @ApiProperty({
    description: 'booking payment notes',
  })
  @Column({ type: 'text', nullable: true })
  paymentNote: string;

  // relations

  @ApiProperty({
    description: 'The vehicle of this booking',
    type: Object,
  })
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.bookings)
  vehicle: Vehicle;

  @ApiProperty({
    description: 'The driver of this booking',
    type: Object,
  })
  @ManyToOne(() => Driver, (driver) => driver.bookings)
  driver: Driver;

  @ApiProperty({
    description: 'The client of this booking',
    type: Object,
  })
  @ManyToOne(() => Client, (client) => client.bookings)
  client: Client;
}
