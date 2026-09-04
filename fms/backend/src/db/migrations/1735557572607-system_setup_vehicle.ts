import { MigrationInterface, QueryRunner } from 'typeorm';

export class SystemSetupVehicle1735557572607 implements MigrationInterface {
  name = 'SystemSetupVehicle1735557572607';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicle_types" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" text, "number_of_seats" text, "note" text, CONSTRAINT "PK_73d1e40f4add7f4f6947acad3a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "inspection_types" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" text, CONSTRAINT "PK_7eed0126c53d4739be53027afae" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "inspection_types"`);
    await queryRunner.query(`DROP TABLE "vehicle_types"`);
  }
}
