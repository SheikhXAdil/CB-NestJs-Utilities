import { MigrationInterface, QueryRunner } from 'typeorm';

export class Drivers1732886142792 implements MigrationInterface {
  name = 'Drivers1732886142792';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "drivers" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text, "phone_number" text, "name" text, "gender" text, "age" integer, "address" text, "joining_date" TIMESTAMP WITH TIME ZONE, "document" text, "reference" text, "notes" text, "issue_date" TIMESTAMP WITH TIME ZONE, "expiration_date" TIMESTAMP WITH TIME ZONE, "license_number" text, "license" text, CONSTRAINT "PK_92ab3fb69e566d3eb0cae896047" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "drivers"`);
  }
}
