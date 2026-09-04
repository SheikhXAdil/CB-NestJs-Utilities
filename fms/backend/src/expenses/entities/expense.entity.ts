import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { Gender } from 'src/common/enums/gender';
import { Vehicle } from 'src/vehicles/entities/vehicle.entity';

@Entity({ name: 'expenses' })
export class Expense extends SoftDeleteEntity {
  @ApiProperty({ description: 'expense ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'expense title',
  })
  @Column({ type: 'text', nullable: true })
  title: string;

  @ApiProperty({
    description: 'expense amount',
  })
  @Column({ type: 'float', nullable: true })
  amount: number;

  @ApiProperty({
    description: 'expense date',
  })
  @Column({ type: 'timestamptz', nullable: true })
  date: moment.Moment;

  @ApiProperty({
    description: 'expense receipt file url',
  })
  @Column({ type: 'text', nullable: true })
  receipt: string;

  @ApiProperty({
    description: 'expense notes',
  })
  @Column({ type: 'text', nullable: true })
  note: string;

  // relations

  @ApiProperty({
    description: 'The vehicle of this expense',
    type: Object,
  })
  @ManyToOne(() => Vehicle, (vehicle) => vehicle.expenses)
  vehicle: Vehicle;
}
