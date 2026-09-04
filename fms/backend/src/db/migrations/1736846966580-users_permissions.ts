import { migrateRolePermissions } from 'src/common/utilities/migrations/role_permissions';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsersPermissions1736846966580 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await migrateRolePermissions(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
