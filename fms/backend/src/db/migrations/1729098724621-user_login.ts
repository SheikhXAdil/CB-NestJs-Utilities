import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserLogin1729098724621 implements MigrationInterface {
  name = 'UserLogin1729098724621';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD IF NOT EXISTS "password_reset_token" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD IF NOT EXISTS "last_login_at" TIMESTAMP WITH TIME ZONE NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "password_reset_token"`,
    );
  }
}
