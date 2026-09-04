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
    type: Array,
  })
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
