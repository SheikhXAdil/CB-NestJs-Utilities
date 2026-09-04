import { MigrationInterface, QueryRunner } from 'typeorm';

export class Fuel1735647919652 implements MigrationInterface {
  name = 'Fuel1735647919652';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "fuels" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fuel_location" text, "total_amount" double precision, "total_quantity" double precision, "meter_reading" double precision, "date_time" TIMESTAMP WITH TIME ZONE, "receipt" text, "note" text, "vehicle_id" uuid, "driver_id" uuid, CONSTRAINT "PK_4e8a7eac61d58da2fbb4b8743e1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "fuels" ADD CONSTRAINT "FK_7cbf8f3944c55becd181aa647a0" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "fuels" ADD CONSTRAINT "FK_74378c4170f6029ee4826be5ed8" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "fuels" DROP CONSTRAINT "FK_74378c4170f6029ee4826be5ed8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "fuels" DROP CONSTRAINT "FK_7cbf8f3944c55becd181aa647a0"`,
    );
    await queryRunner.query(`DROP TABLE "fuels"`);
  }
}
