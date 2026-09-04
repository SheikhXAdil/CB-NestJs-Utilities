import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/roles/entities/role.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SoftDeleteEntity } from 'src/common/classes/SoftDeleteEntity';
import { Inspection } from 'src/vehicle-inspections/entities/vehicle-inspection.entity';

@Entity({ name: 'users' })
export class User extends SoftDeleteEntity {
  @ApiProperty({ description: 'user ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'user Email Address',
  })
  @Column({ type: 'text', nullable: true })
  email: string;

  @ApiProperty({
    description: 'user Password',
  })
  @Column({ type: 'text', nullable: true })
  password: string;

  @ApiProperty({
    description: 'user Phone number',
  })
  @Column({ type: 'text', nullable: true })
  phoneNumber: string;

  @ApiProperty({
    description: 'user name',
  })
  @Column({ type: 'text', nullable: true })
  name: string;

  // login information
  @ApiProperty({ description: 'user password reset token' })
  @Column({ type: 'text', nullable: true })
  passwordResetToken: string;

  @ApiProperty({ description: 'Time when last time user was sent otp' })
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: moment.Moment;

  // relations
  @ApiProperty({
    description: 'user roles',
    type: 'array',
    items: { type: 'object' },
  })
  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ApiProperty({ description: 'user inspections', type: Object })
  @OneToMany(() => Inspection, (user) => user.inspectionBy)
  inspections: Inspection[];

  // additional properties
  assignedRole: string;
}
