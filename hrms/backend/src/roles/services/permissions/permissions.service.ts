import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreatePermissionDto } from 'src/roles/dto/permission.dto';
import { Permission } from 'src/roles/entities/permission.entity';
// import { Permission } from '../roles/entities/permission.entity';
import { Repository } from 'typeorm';
// import { CreatePermissionDto } from '../roles/dto/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const permission = this.permissionRepository.create(createPermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async findOne(id: string) {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: { roles: true },
    });
    if (!permission) {
      throw new NotFoundException('Please enter a valid permission');
    }
    return permission;
  }

  async findAll() {
    return await this.permissionRepository.find({
      relations: {
        roles: false,
      },
    });
  }

  async remove(id: string) {
    const permission = await this.findOne(id);
    const result = await this.permissionRepository.remove(permission);
    return result;
  }
}
