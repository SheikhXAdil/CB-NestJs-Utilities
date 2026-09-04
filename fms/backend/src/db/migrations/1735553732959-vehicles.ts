import { MigrationInterface, QueryRunner } from 'typeorm';

export class Vehicles1735553732959 implements MigrationInterface {
  name = 'Vehicles1735553732959';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicles" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" text, "name" text, "model" text, "engine_number" text, "engine_type" text, "license_plate" text, "color" text, "registration_expiry_date" TIMESTAMP WITH TIME ZONE, "document" text, "note" text, CONSTRAINT "PK_18d8646b59304dce4af3a9e35b6" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "vehicles"`);
  }
}
