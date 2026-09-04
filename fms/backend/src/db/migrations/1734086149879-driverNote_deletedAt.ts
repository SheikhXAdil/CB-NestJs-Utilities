import { MigrationInterface, QueryRunner } from 'typeorm';

export class DriverNoteDeletedAt1734086149879 implements MigrationInterface {
  name = 'DriverNoteDeletedAt1734086149879';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "drivers" RENAME COLUMN "notes" TO "note"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "deleted_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ALTER COLUMN "deleted_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "deleted_at" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "clients" ALTER COLUMN "deleted_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" ALTER COLUMN "deleted_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "employees" ALTER COLUMN "deleted_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "drivers" RENAME COLUMN "note" TO "notes"`,
    );
  }
}
