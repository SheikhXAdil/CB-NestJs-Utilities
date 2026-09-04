import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';
import { User } from 'src/users/entities/user.entity';
import {
  InspectionChecklistDto,
  VehicleFuelReading,
  VehicleInspectionStatus,
  VehicleRepairStatus,
} from '../dto/vehicle-inspection.dto';

@Entity({ name: 'vehicle_inspections' })
export class Inspection extends SoftDeleteEntity {
  @ApiProperty({ description: 'vehicle inspection ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'vehicle inspection status',
  })
  @Column({ type: 'text', nullable: true })
  inspectionStatus: VehicleInspectionStatus;

  @ApiProperty({
    description: 'vehicle repair status',
  })
  @Column({ type: 'text', nullable: true })
  repairStatus: VehicleRepairStatus;

  @ApiProperty({
    description: 'vehicle inspection start date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  inspectionDate: moment.Moment;

  @ApiProperty({
    description: 'vehicle inspection note',
  })
  @Column({ type: 'text', nullable: true })
  note: string;

  @ApiProperty({
    description: 'vehicle inspection checklist',
  })
  @Column({ type: 'json', nullable: false, default: [] })
  inspectionChecklist: InspectionChecklistDto;

  // ongoing details
  @ApiProperty({
    description: 'vehicle inspection ongoing fuel reading',
  })
  @Column({ type: 'text', nullable: true })
  ongoingFuelReading: VehicleFuelReading;

  @ApiProperty({
    description: 'vehicle inspection ongoing meter reading',
  })
  @Column({ type: 'float', nullable: false, default: 0 })
  ongoingMeterReading: number;

  @ApiProperty({
    description: 'vehicle inspection ongoing dateTime',
  })
  @Column({ type: 'timestamptz', nullable: true })
  ongoingDateTime: moment.Moment;

  // incoming details
  @ApiProperty({
    description: 'vehicle inspection incoming fuel reading',
  })
  @Column({ type: 'text', nullable: true })
  incomingFuelReading: VehicleFuelReading;

  @ApiProperty({
    description: 'vehicle inspection incoming meter reading',
  })
  @Column({ type: 'float', nullable: false, default: 0 })
  incomingMeterReading: number;

  @ApiProperty({
    description: 'vehicle inspection incoming dateTime',
  })
  @Column({ type: 'timestamptz', nullable: true })
  incomingDateTime: moment.Moment;

  // relations
  @ApiProperty({
    description: 'The user who did this inspection',
    type: Object,
  })
  @ManyToOne(() => User, (user) => user.inspections)
  inspectionBy: User;

  @ApiProperty({
    description: 'The vehicle of this inspection',
    type: Object,
  })
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.inspections)
  inspectionVehicle: Vehicle;
}
