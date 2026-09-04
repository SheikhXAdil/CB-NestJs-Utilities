import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';

@Entity({ name: 'contacts' })
export class Contact extends SoftDeleteEntity {
  @ApiProperty({ description: 'contact ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'contact name',
  })
  @Column({ type: 'text', nullable: true })
  name: string;

  @ApiProperty({
    description: 'contact email',
  })
  @Column({ type: 'text', nullable: true })
  email: string;

  @ApiProperty({
    description: 'contact number',
  })
  @Column({ type: 'text', nullable: true })
  contactNumber: string;

  @ApiProperty({
    description: 'contact message',
  })
  @Column({ type: 'text', nullable: true })
  subject: string;

  @ApiProperty({
    description: 'contact subject',
  })
  @Column({ type: 'text', nullable: true })
  message: string;
}
