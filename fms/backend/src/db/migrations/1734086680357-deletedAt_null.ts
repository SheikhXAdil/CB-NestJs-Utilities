import { MigrationInterface, QueryRunner } from 'typeorm';

export class DeletedAtNull1734086680357 implements MigrationInterface {
  name = 'DeletedAtNull1734086680357';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "deleted_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "deleted_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ALTER COLUMN "deleted_at" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "drivers" ALTER COLUMN "deleted_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "deleted_at" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "deleted_at" SET NOT NULL`,
    );
  }
}
