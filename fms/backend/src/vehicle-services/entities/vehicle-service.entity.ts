import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { VehicleServiceStatus } from '../dto/vehicle-service.dto';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';

@Entity({ name: 'vehicle_services' })
export class Service extends SoftDeleteEntity {
  @ApiProperty({ description: 'vehicle service ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'vehicle service total Amount',
  })
  @Column({ type: 'float', nullable: false, default: 0 })
  totalAmount: number;

  @ApiProperty({
    description: 'vehicle service status',
  })
  @Column({ type: 'text', nullable: true })
  status: VehicleServiceStatus;

  @ApiProperty({
    description: 'vehicle service start date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  startDate: moment.Moment;

  @ApiProperty({
    description: 'vehicle service end date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  endDate: moment.Moment;

  @ApiProperty({
    description: 'vehicle service attachment file url',
  })
  @Column({ type: 'text', nullable: true })
  attachment: string;

  @ApiProperty({
    description: 'vehicle service note',
  })
  @Column({ type: 'text', nullable: true })
  note: string;

  // relations

  @ApiProperty({
    description: 'The vehicle of this service',
    type: Object,
  })
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.services)
  vehicle: Vehicle;
}
