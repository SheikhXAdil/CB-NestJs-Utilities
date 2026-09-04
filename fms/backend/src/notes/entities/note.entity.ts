import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';

@Entity({ name: 'notes' })
export class Note extends SoftDeleteEntity {
  @ApiProperty({ description: 'note ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'note title',
  })
  @Column({ type: 'text', nullable: true })
  title: string;

  @ApiProperty({
    description: 'note description',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'note attachment file url',
  })
  @Column({ type: 'text', nullable: true })
  attachment: string;
}
