import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserInfoSoftDelete1732280024563 implements MigrationInterface {
  name = 'UserInfoSoftDelete1732280024563';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD IF NOT EXISTS "deleted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD IF NOT EXISTS "is_deleted" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_deleted"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "deleted_at"`);
  }
}
