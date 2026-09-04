import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { Expense } from 'src/expenses/entities/expense.entity';
import { Fuel } from 'src/fuel/entities/fuel.entity';
import { Service } from 'src/vehicle-services/entities/vehicle-service.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Inspection } from 'src/vehicle-inspections/entities/vehicle-inspection.entity';

@Entity({ name: 'vehicles' })
export class Vehicle extends SoftDeleteEntity {
  @ApiProperty({ description: 'vehicle ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Vehicle Readable number/id' })
  @Column({ type: 'text', nullable: true })
  vehicleId: string;

  @ApiProperty({
    description: 'vehicle Type',
  })
  @Column({ type: 'text', nullable: true })
  type: string;

  @ApiProperty({
    description: 'vehicle name',
  })
  @Column({ type: 'text', nullable: true })
  name: string;

  @ApiProperty({
    description: 'vehicle model',
  })
  @Column({ type: 'text', nullable: true })
  model: string;

  @ApiProperty({
    description: 'vehicle engineNumber',
  })
  @Column({ type: 'text', nullable: true })
  engineNumber: string;

  @ApiProperty({
    description: 'vehicle engineType',
  })
  @Column({ type: 'text', nullable: true })
  engineType: string;

  @ApiProperty({
    description: 'vehicle license Number',
  })
  @Column({ type: 'text', nullable: true })
  licensePlate: string;

  @ApiProperty({
    description: 'vehicle color',
  })
  @Column({ type: 'text', nullable: true })
  color: string;

  @ApiProperty({
    description: 'vehicle registration expiry Date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  registrationExpiryDate: moment.Moment;

  @ApiProperty({
    description: 'vehicle document file url',
  })
  @Column({ type: 'text', nullable: true })
  document: string;

  @ApiProperty({
    description: 'vehicle note',
  })
  @Column({ type: 'text', nullable: true })
  note: string;

  // relations
  @ApiProperty({ description: 'Vehicle expenses', type: Object })
  @OneToMany(() => Expense, (expense) => expense.vehicle)
  expenses: Expense[];

  @ApiProperty({ description: 'Vehicle fuels', type: Object })
  @OneToMany(() => Fuel, (fuel) => fuel.vehicle)
  fuels: Fuel[];

  @ApiProperty({ description: 'Vehicle services', type: Object })
  @OneToMany(() => Service, (service) => service.vehicle)
  services: Service[];

  @ApiProperty({ description: 'Vehicle bookings', type: Object })
  @OneToMany(() => Booking, (booking) => booking.vehicle)
  bookings: Booking[];

  @ApiProperty({ description: 'Vehicle inspections', type: Object })
  @OneToMany(() => Inspection, (inspection) => inspection.inspectionVehicle)
  inspections: Inspection[];
}
