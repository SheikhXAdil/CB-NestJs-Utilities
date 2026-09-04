import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';

@Entity({ name: 'vehicle_types' })
export class VehicleType extends SoftDeleteEntity {
  @ApiProperty({ description: 'Vehicle type ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Vehicle type name',
  })
  @Column({ type: 'text', nullable: true })
  type: string;

  @ApiProperty({
    description: 'Vehicle type number of seats',
  })
  @Column({ type: 'int', nullable: true })
  numberOfSeats: number;

  @ApiProperty({
    description: 'Vehicle type note',
  })
  @Column({ type: 'text', nullable: true })
  note: string;
}
