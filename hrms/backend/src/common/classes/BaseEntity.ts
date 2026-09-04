import { ApiProperty } from '@nestjs/swagger';
import moment from 'moment-timezone';
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export class BaseEntity {
  @ApiProperty({ description: 'TIme when entity was created', type: String })
  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'NOW()',
  })
  createdAt: moment.Moment;

  @ApiProperty({ description: 'TIme when entity was updated', type: String })
  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'NOW()',
    onUpdate: 'NOW()',
  })
  updatedAt: moment.Moment;
}
