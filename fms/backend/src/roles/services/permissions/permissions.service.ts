import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Pagination } from 'nestjs-typeorm-paginate';
import { Action } from 'src/casl/casl-ability.factory/actions.enum';
import {
  CreatePermissionDto,
  updatePermissionDto,
} from 'src/roles/dto/permission.dto';
import { Permission } from 'src/roles/entities/permission.entity';
import { FindOptionsWhere, Repository } from 'typeorm';

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

  async update(id: string, updatePermissionDto: updatePermissionDto) {
    let permission = await this.findOne({ id });

    permission = { ...permission, ...updatePermissionDto };

    return await this.permissionRepository.save(permission);
  }

  async findOne(
    options: FindOptionsWhere<Permission>,
    relations: string[] = [],
  ) {
    const permission = await this.permissionRepository.findOne({
      where: options,
      relations,
    });
    if (!permission) {
      throw new NotFoundException('Please enter a valid permission');
    }
    return permission;
  }

  async findAll(
    options: FindOptionsWhere<Permission>,
    mapData: boolean = true,
  ): Promise<Permission[]> {
    const permissions = await this.permissionRepository.find({
      relations: {
        roles: false,
      },
      where: options,
      order: {
        entity: 'DESC',
        permission: 'ASC',
      },
    });

    if (!mapData) {
      return permissions;
    }

    return this.mapDataForFindAll(permissions);
  }

  private mapDataForFindAll(data: Permission[]) {
    const returnData: Permission[] = data.map((e) => {
      const permission = {
        id: e.id,
        permission: e.permission,
        entity: e.entity,
      };
      return permission as Permission;
    });

    return returnData;
  }

  async remove(id: string) {
    const permission = await this.findOne({ id });
    const result = await this.permissionRepository.save(permission);
    return result;
  }

  async getPermissionsForRole(permissions: Partial<CreatePermissionDto>[]) {
    let res = await this.findAll(
      {
        permission: Action.Show,
        visibility: false,
      },
      false,
    );

    for (const permission of permissions) {
      if (permission.permission === Action.Manage) {
        const dbPermissions = await this.findAll({ entity: permission.entity });
        res.push(...dbPermissions);
      } else {
        const dbPermission = await this.findOne({
          entity: permission.entity,
          permission: permission.permission,
        });
        res.push(dbPermission);
      }
    }

    res = res.reduce((acc, obj) => {
      if (!acc.some((item) => item.id === obj.id)) {
        acc.push(obj);
      }
      return acc;
    }, []);

    return res;
  }
}
