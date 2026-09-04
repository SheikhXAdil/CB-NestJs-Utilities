import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';
import { Driver } from 'src/drivers/entities/driver.entity';

@Entity({ name: 'fuels' })
export class Fuel extends SoftDeleteEntity {
  @ApiProperty({ description: 'fuel ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'fuel location',
  })
  @Column({ type: 'text', nullable: true })
  fuelLocation: string;

  @ApiProperty({
    description: 'fuel total Amount',
  })
  @Column({ type: 'float', nullable: true })
  totalAmount: number;

  @ApiProperty({
    description: 'fuel total Quantity',
  })
  @Column({ type: 'float', nullable: true })
  totalQuantity: number;

  @ApiProperty({
    description: 'fuel meter reading',
  })
  @Column({ type: 'float', nullable: true })
  meterReading: number;

  @ApiProperty({
    description: 'fuel date time',
  })
  @Column({ type: 'timestamptz', nullable: true })
  dateTime: moment.Moment;

  @ApiProperty({
    description: 'fuel receipt file url',
  })
  @Column({ type: 'text', nullable: true })
  receipt: string;

  @ApiProperty({
    description: 'fuel notes',
  })
  @Column({ type: 'text', nullable: true })
  note: string;

  // relations
  @ApiProperty({
    description: 'The vehicle of this entity',
    type: Object,
  })
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.fuels)
  vehicle: Vehicle;

  @ApiProperty({
    description: 'The driver of this entity',
    type: Object,
  })
  @ManyToOne(() => Driver, (driver) => driver.fuels)
  driver: Driver;
}
