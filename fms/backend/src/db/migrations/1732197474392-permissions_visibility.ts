import { MigrationInterface, QueryRunner } from 'typeorm';

export class PermissionsVisibility1732197474392 implements MigrationInterface {
  name = 'PermissionsVisibility1732197474392';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permissions" ADD IF NOT EXISTS "visibility" boolean NOT NULL DEFAULT true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "permissions" DROP COLUMN "visibility"`,
    );
  }
}
