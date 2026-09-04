import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';

@Entity({ name: 'inspection_types' })
export class InspectionType extends SoftDeleteEntity {
  @ApiProperty({ description: 'inspection type ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'inspection type name',
  })
  @Column({ type: 'text', nullable: true })
  type: string;
}
