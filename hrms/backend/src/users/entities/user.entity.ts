import { ApiProperty } from '@nestjs/swagger';
import { Role } from 'src/roles/entities/role.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from 'src/common/classes/BaseEntity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @ApiProperty({ description: 'User ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'User Email Address',
  })
  @Column({ type: 'text', nullable: true })
  email: string;

  @ApiProperty({
    description: 'User Password',
  })
  @Column({ type: 'text', nullable: true })
  password: string;

  // login information
  @ApiProperty({ description: 'User password reset token' })
  @Column({ type: 'text', nullable: true })
  passwordResetToken: string;

  @ApiProperty({ description: 'Time when last time user was sent otp' })
  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt: moment.Moment;

  // relations
  @ApiProperty({ description: 'User roles' })
  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
