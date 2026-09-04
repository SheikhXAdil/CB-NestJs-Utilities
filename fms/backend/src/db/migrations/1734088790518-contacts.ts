import { MigrationInterface, QueryRunner } from 'typeorm';

export class Contacts1734088790518 implements MigrationInterface {
  name = 'Contacts1734088790518';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "contacts" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text, "email" text, "contact_number" text, "subject" text, "message" text, CONSTRAINT "PK_b99cd40cfd66a99f1571f4f72e6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ALTER COLUMN "deleted_at" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ALTER COLUMN "deleted_at" DROP DEFAULT`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "notes" ALTER COLUMN "deleted_at" SET DEFAULT now()`,
    );
    await queryRunner.query(
      `ALTER TABLE "notes" ALTER COLUMN "deleted_at" SET NOT NULL`,
    );
    await queryRunner.query(`DROP TABLE "contacts"`);
  }
}
