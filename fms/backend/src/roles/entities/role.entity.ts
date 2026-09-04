import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from 'src/common/classes/BaseEntity';
import { Permission } from 'src/roles/entities/permission.entity';

@Entity({ name: 'roles' })
export class Role extends BaseEntity {
  @ApiProperty({ description: 'Role ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Role Name',
  })
  @Column({ type: 'text', nullable: false })
  roleName: string;

  @ApiProperty({
    description: 'Count of users this role is assigned to',
  })
  @Column({ type: 'int', nullable: false, default: 0 })
  assignedUsersCount: number;

  @ApiProperty({
    description: 'Count of permissions this role is assigned',
  })
  @Column({ type: 'int', nullable: false, default: 0 })
  assignedPermissionsCount: number;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @ApiProperty({
    description: 'users this role is related to',
    type: 'array',
    items: { type: 'object' },
  })
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
