import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserLastLoginAtNullable1729603702014
  implements MigrationInterface
{
  name = 'UserLastLoginAtNullable1729603702014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "last_login_at" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "last_login_at" SET NOT NULL`,
    );
  }
}
