import { readFileSync } from 'fs';
import { join } from 'path';
import { Permission } from 'src/roles/entities/permission.entity';
import { Role } from 'src/roles/entities/role.entity';
import { QueryRunner } from 'typeorm';

export const migrateRolePermissions = async (
  queryRunner: QueryRunner,
): Promise<void> => {
  const rolesRepository = queryRunner.manager.getRepository(Role);
  const permissionRepository = queryRunner.manager.getRepository(Permission);

  const permissionsObj = JSON.parse(
    readFileSync(
      join(__dirname, '../../../roles/', 'seed-data/permissions.json'),
      'utf8',
    ),
  );

  const rolesObj = JSON.parse(
    readFileSync(
      join(__dirname, '../../../roles/', 'seed-data/roles.json'),
      'utf8',
    ),
  );

  await permissionRepository.query(
    'TRUNCATE TABLE "permissions" RESTART IDENTITY CASCADE;',
  );
  await permissionRepository.insert(permissionsObj);

  for (const role of rolesObj) {
    let dbRole = await rolesRepository.findOne({
      where: { roleName: role.roleName },
      relations: { permissions: true },
    });

    if (!dbRole) {
      dbRole = await rolesRepository.save(role);
    }

    const newRolePermissions = [];
    for (let i = 0; i < role.permissions.length; i++) {
      const per = role.permissions[i];
      const permission = await permissionRepository.findOne({
        where: {
          entity: per.entity,
          permission: per.permission,
        },
      });
      newRolePermissions.push(permission.id);
    }
    dbRole.permissions = newRolePermissions.map((id) => ({
      ...new Permission(),
      id,
    }));
    await rolesRepository.save(dbRole);
  }
};
