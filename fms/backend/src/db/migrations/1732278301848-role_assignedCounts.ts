import { MigrationInterface, QueryRunner } from 'typeorm';

export class RoleAssignedCounts1732278301848 implements MigrationInterface {
  name = 'RoleAssignedCounts1732278301848';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" ADD IF NOT EXISTS "assigned_users_count" integer NOT NULL DEFAULT '0'`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" ADD IF NOT EXISTS "assigned_permissions_count" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN "assigned_permissions_count"`,
    );
    await queryRunner.query(
      `ALTER TABLE "roles" DROP COLUMN "assigned_users_count"`,
    );
  }
}
