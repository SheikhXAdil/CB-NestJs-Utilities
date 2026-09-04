import { MigrationInterface, QueryRunner } from 'typeorm';

export class Bookings1736161008565 implements MigrationInterface {
  name = 'Bookings1736161008565';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "bookings" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total_amount" double precision NOT NULL DEFAULT '0', "traveler_count" double precision NOT NULL DEFAULT '0', "approx_distance" double precision NOT NULL DEFAULT '0', "status" text, "start_date_time" TIMESTAMP WITH TIME ZONE, "end_date_time" TIMESTAMP WITH TIME ZONE, "pick_up_address" text, "drop_off_address" text, "note" text, "payment_status" text, "payment_note" text, "vehicle_id" uuid, "driver_id" uuid, "client_id" uuid, CONSTRAINT "PK_bee6805982cc1e248e94ce94957" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_314ee41921742fb13c9309e4054" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_79817be127e277ffc640593de6e" FOREIGN KEY ("driver_id") REFERENCES "drivers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" ADD CONSTRAINT "FK_23096dca2f7a9d1505d0267d4c6" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_23096dca2f7a9d1505d0267d4c6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_79817be127e277ffc640593de6e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "bookings" DROP CONSTRAINT "FK_314ee41921742fb13c9309e4054"`,
    );
    await queryRunner.query(`DROP TABLE "bookings"`);
  }
}
