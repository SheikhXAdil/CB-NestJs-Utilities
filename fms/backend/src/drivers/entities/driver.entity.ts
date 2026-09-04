import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { Gender } from 'src/common/enums/gender';
import { Fuel } from 'src/fuel/entities/fuel.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Entity({ name: 'drivers' })
export class Driver extends SoftDeleteEntity {
  @ApiProperty({ description: 'driver ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'driver readable number/id',
  })
  @Column({ type: 'text', nullable: true })
  driverId: string;

  @ApiProperty({
    description: 'driver Email Address',
  })
  @Column({ type: 'text', nullable: true })
  email: string;

  @ApiProperty({
    description: 'driver Phone number',
  })
  @Column({ type: 'text', nullable: true })
  phoneNumber: string;

  @ApiProperty({
    description: 'driver name',
  })
  @Column({ type: 'text', nullable: true })
  name: string;

  @ApiProperty({
    description: 'driver gender',
  })
  @Column({ type: 'text', nullable: true })
  gender: Gender;

  @ApiProperty({
    description: 'driver age',
  })
  @Column({ type: 'int', nullable: true })
  age: number;

  @ApiProperty({
    description: 'driver address',
  })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({
    description: 'driver joining date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  joiningDate: moment.Moment;

  @ApiProperty({
    description: 'driver document file url',
  })
  @Column({ type: 'text', nullable: true })
  document: string;

  @ApiProperty({
    description: 'driver reference',
  })
  @Column({ type: 'text', nullable: true })
  reference: string;

  @ApiProperty({
    description: 'driver notes',
  })
  @Column({ type: 'text', nullable: true })
  note: string;

  // driver license information
  @ApiProperty({
    description: 'driver license issue Date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  issueDate: moment.Moment;

  @ApiProperty({
    description: 'driver license expiration Date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  expirationDate: moment.Moment;

  @ApiProperty({
    description: 'driver license Number',
  })
  @Column({ type: 'text', nullable: true })
  licenseNumber: string;

  @ApiProperty({
    description: 'driver license file url',
  })
  @Column({ type: 'text', nullable: true })
  license: string;

  // relations
  @ApiProperty({ description: 'driver fuels', type: Object })
  @OneToMany(() => Fuel, (fuel) => fuel.driver)
  fuels: Fuel[];

  @ApiProperty({ description: 'driver bookings', type: Object })
  @OneToMany(() => Booking, (booking) => booking.vehicle)
  bookings: Booking[];
}
