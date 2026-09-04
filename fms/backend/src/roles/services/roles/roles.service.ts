import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateRoleDto,
  RoleSortKeys,
  UpdateRoleDto,
} from 'src/roles/dto/role.dto';
import { Role } from 'src/roles/entities/role.entity';
import {
  Brackets,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { PermissionsService } from '../permissions/permissions.service';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { SortOptions } from 'src/common/classes/Sorting';
import { ExportService } from 'src/export/export.service';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly permissionsService: PermissionsService,
    private readonly exportService: ExportService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.rolesRepository.create(createRoleDto);

    const rolePermissions = await this.permissionsService.getPermissionsForRole(
      createRoleDto.permissions,
    );

    role.permissions = rolePermissions;
    role.assignedPermissionsCount = rolePermissions.length;

    return await this.rolesRepository.save(role);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto) {
    const role = await this.findOne({ id }, ['permissions']);

    if (updateRoleDto.roleName) {
      role.roleName = updateRoleDto.roleName;
    }

    const rolePermissions = await this.permissionsService.getPermissionsForRole(
      updateRoleDto.permissions,
    );

    role.permissions = rolePermissions;
    role.assignedPermissionsCount = rolePermissions.length;

    return await this.rolesRepository.save(role);
  }

  async findAll(
    paginationOptions: IPaginationOptions,
    sortOptions: SortOptions<RoleSortKeys> = {
      sortKey: RoleSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.rolesRepository.createQueryBuilder('role');

    query = this.applySortingQueryForFindAll(query, sortOptions);
    query = this.applySearchQueryForFindAll(query, search);

    const roles = await paginate(query, paginationOptions);

    return this.mapDataForFindAll(roles);
  }

  private applySearchQueryForFindAll(
    query: SelectQueryBuilder<Role>,
    search: string,
  ) {
    if (search) {
      const searchTerms = search.trim().replace(/\s+/g, ' ').split(' '); // removing extra white spaces
      const ilikeConditions = [];
      const parameters = {};

      searchTerms.forEach((term, index) => {
        const paramName = `term${index}`;
        ilikeConditions.push(`role.roleName ILIKE :${paramName}`);
        parameters[paramName] = `%${term}%`;
      });

      query = query.andWhere(
        new Brackets((qb) =>
          qb.andWhere(ilikeConditions.join(' OR '), parameters),
        ),
      );
    }

    return query;
  }

  private applySortingQueryForFindAll(
    query: SelectQueryBuilder<Role>,
    sortOptions: SortOptions<RoleSortKeys>,
  ) {
    query = query.orderBy(`role.${sortOptions.sortKey}`, sortOptions.sortOrder);
    return query;
  }

  private mapDataForFindAll(data: Pagination<Role>) {
    const returnData = { items: [], meta: data.meta };
    returnData.items = data.items.map((e) => {
      const role = {
        id: e.id,
        roleName: e.roleName,
        assignedPermissionsCount: e.assignedPermissionsCount,
        assignedUsersCount: e.assignedUsersCount,
      };
      return role;
    });

    return returnData;
  }

  async findOne(options: FindOptionsWhere<Role>, relations: string[] = []) {
    const role = await this.rolesRepository.findOne({
      where: options,
      relations,
    });

    if (!role) {
      throw new NotFoundException('Please enter a valid Role');
    }
    return role;
  }

  async remove(id: string) {
    const role = await this.findOne({ id });
    const result = await this.rolesRepository.save(role);
    return result;
  }

  async incrementAssignedUserCount(role: Role) {
    role.assignedUsersCount++;
    return await this.rolesRepository.save(role);
  }

  private mapDataForExport(data: Role[]) {
    const returnData = data.map((e) => {
      const role = {
        id: e.id,
        roleName: e.roleName,
        assignedPermissionsCount: e.assignedPermissionsCount,
        assignedUsersCount: e.assignedUsersCount,
      };
      return role;
    });

    return returnData;
  }

  async getDataForExport(
    sortOptions: SortOptions<RoleSortKeys> = {
      sortKey: RoleSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    let query = this.rolesRepository.createQueryBuilder('role');

    query = this.applySearchQueryForFindAll(query, search);
    query = this.applySortingQueryForFindAll(query, sortOptions);

    const roles = await query.getMany();
    const mappedRoles = this.mapDataForExport(roles);

    return mappedRoles;
  }

  async copyPrint(
    sortOptions: SortOptions<RoleSortKeys> = {
      sortKey: RoleSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const roles = await this.getDataForExport(sortOptions, search);

    const header = `Smart Fleet SaaS - Role\n\nRole\tAssigned Users\tAssigned Permissions\n`;

    const data = roles
      .map((e) => {
        const roleName = e.roleName || '-';
        const assignedUsersCount = e.assignedUsersCount || 0;
        const assignedPermissionsCount = e.assignedPermissionsCount || 0;

        return `${roleName}\t${assignedUsersCount}\t${assignedPermissionsCount}`;
      })
      .join('\n');

    const exportData = `${header}${data}`;
    const rowCount = roles.length;
    return { exportData, rowCount };
  }

  async generateCsv(
    sortOptions: SortOptions<RoleSortKeys> = {
      sortKey: RoleSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const roles = await this.getDataForExport(sortOptions, search);

    const mappedRoles = roles.map((e) => {
      const obj = {
        Role: e.roleName,
        'Assigned Users': e.assignedUsersCount,
        'Assigned Permissions': e.assignedPermissionsCount,
      };
      return obj;
    });

    return this.exportService.generateCsv(mappedRoles);
  }

  async generateExcelFile(
    sortOptions: SortOptions<RoleSortKeys> = {
      sortKey: RoleSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const roles = await this.getDataForExport(sortOptions, search);

    const mappedRoles = roles.map((e) => {
      const obj = {
        Role: e.roleName,
        'Assigned Users': e.assignedUsersCount,
        'Assigned Permissions': e.assignedPermissionsCount,
      };
      return obj;
    });

    return this.exportService.generateExcelFile(mappedRoles, 'Role');
  }

  async generatePdf(
    sortOptions: SortOptions<RoleSortKeys> = {
      sortKey: RoleSortKeys.id,
      sortOrder: 'ASC',
    },
    search: string = null,
  ) {
    const roles = await this.getDataForExport(sortOptions, search);

    const mappedRoles = roles.map((e) => {
      const obj = {
        Role: e.roleName,
        'Assigned Users': e.assignedUsersCount,
        'Assigned Permissions': e.assignedPermissionsCount,
      };
      return obj;
    });

    return this.exportService.generatePdf(
      mappedRoles,
      'Smart Fleet SaaS - Role',
    );
  }
}
