import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { Gender } from 'src/common/enums/gender';
import { Booking } from 'src/bookings/entities/booking.entity';

@Entity({ name: 'clients' })
export class Client extends SoftDeleteEntity {
  @ApiProperty({ description: 'Client ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Client Readable number/id' })
  @Column({ type: 'text', nullable: true })
  clientId: string;

  @ApiProperty({ description: 'Client Name' })
  @Column({ type: 'text', nullable: true })
  name: string;

  @ApiProperty({ description: 'Client Email Address' })
  @Column({ type: 'text', nullable: true })
  email: string;

  @ApiProperty({ description: 'Client Phone Number' })
  @Column({ type: 'text', nullable: true })
  phoneNumber: string;

  @ApiProperty({ description: 'Client Gender' })
  @Column({ type: 'text', nullable: true })
  gender: Gender;

  @ApiProperty({ description: 'Client Country' })
  @Column({ type: 'text', nullable: true })
  country: string;

  @ApiProperty({ description: 'Client State' })
  @Column({ type: 'text', nullable: true })
  state: string;

  @ApiProperty({ description: 'Client City' })
  @Column({ type: 'text', nullable: true })
  city: string;

  @ApiProperty({ description: 'Client Zip Code' })
  @Column({ type: 'text', nullable: true })
  zipCode: string;

  @ApiProperty({ description: 'Client Address' })
  @Column({ type: 'text', nullable: true })
  address: string;

  @ApiProperty({ description: 'Client Note' })
  @Column({ type: 'text', nullable: true })
  note: string;

  // relations

  @ApiProperty({ description: 'client bookings', type: Object })
  @OneToMany(() => Booking, (booking) => booking.vehicle)
  bookings: Booking[];
}
