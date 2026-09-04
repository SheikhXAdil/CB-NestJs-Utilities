import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserInfo1732280353086 implements MigrationInterface {
  name = 'UserInfo1732280353086';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD IF NOT EXISTS "phone_number" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD IF NOT EXISTS "name" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_number"`);
  }
}
