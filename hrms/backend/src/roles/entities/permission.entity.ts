import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from 'src/common/classes/BaseEntity';
import { Role } from 'src/roles/entities/role.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'permissions' })
export class Permission extends BaseEntity {
  @ApiProperty({ description: 'Permission ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Entity this permission can access' })
  @Column({ type: 'text' })
  entity: string;

  @ApiProperty({ description: 'Permission Type' })
  @Column({ type: 'text' })
  permission: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
