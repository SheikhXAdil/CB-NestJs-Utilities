import { MigrationInterface, QueryRunner } from 'typeorm';

export class VehicleInspections1736337194830 implements MigrationInterface {
  name = 'VehicleInspections1736337194830';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicle_inspections" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inspection_status" text, "repair_status" text, "inspection_date" TIMESTAMP WITH TIME ZONE, "note" text, "inspection_checklist" json NOT NULL DEFAULT '[]', "ongoing_fuel_reading" text, "ongoing_meter_reading" double precision NOT NULL DEFAULT '0', "ongoing_date_time" TIMESTAMP WITH TIME ZONE, "incoming_fuel_reading" text, "incoming_meter_reading" double precision NOT NULL DEFAULT '0', "incoming_date_time" TIMESTAMP WITH TIME ZONE, "inspection_by_id" uuid, "inspection_vehicle_id" uuid, CONSTRAINT "PK_45f26ea872b770773c59fa253c6" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "FK_3ffdd1a0f8c3455e96c336ecac7" FOREIGN KEY ("inspection_by_id") REFERENCES "employees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_inspections" ADD CONSTRAINT "FK_a283f6e156441ad4ab68fda4ce0" FOREIGN KEY ("inspection_vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_inspections" DROP CONSTRAINT "FK_a283f6e156441ad4ab68fda4ce0"`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_inspections" DROP CONSTRAINT "FK_3ffdd1a0f8c3455e96c336ecac7"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_inspections"`);
  }
}
