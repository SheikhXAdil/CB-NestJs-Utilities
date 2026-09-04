import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateRoleDto } from 'src/roles/dto/role.dto';
import { Role } from 'src/roles/entities/role.entity';
import { Repository } from 'typeorm';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.rolesRepository.create(createRoleDto);
    return await this.rolesRepository.save(role);
  }

  async findAll() {
    return await this.rolesRepository.find({
      relations: {
        permissions: true,
      },
    });
  }

  async findOne(roleName: string) {
    const role = await this.rolesRepository.findOne({
      where: { roleName },
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException('Please enter a valid Role');
    }
    return role;
  }

  async remove(id: string) {
    const role = await this.findOne(id);
    const result = await this.rolesRepository.remove(role);
    return result;
  }
}
