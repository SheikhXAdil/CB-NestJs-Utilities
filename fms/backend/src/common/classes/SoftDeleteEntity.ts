import { ApiProperty } from '@nestjs/swagger';
import moment from 'moment-timezone';
import { Column } from 'typeorm';
import { BaseEntity } from './BaseEntity';

export class SoftDeleteEntity extends BaseEntity {
  @ApiProperty({ description: 'TIme when entity was deleted', type: String })
  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: moment.Moment;

  @ApiProperty({ description: 'Flag for deletion of entity' })
  @Column({
    type: 'boolean',
    default: false,
  })
  isDeleted: boolean;
}
