import { MigrationInterface, QueryRunner } from 'typeorm';

export class VehicleService1736002073738 implements MigrationInterface {
  name = 'VehicleService1736002073738';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "vehicle_services" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "total_amount" double precision NOT NULL DEFAULT '0', "status" text, "start_date" TIMESTAMP WITH TIME ZONE, "end_date" TIMESTAMP WITH TIME ZONE, "attachment" text, "note" text, "vehicle_id" uuid, CONSTRAINT "PK_052cfe0f2218e5af2b11749a83f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "vehicle_services" ADD CONSTRAINT "FK_1f47ed83d5a0459356e0a303387" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "vehicle_services" DROP CONSTRAINT "FK_1f47ed83d5a0459356e0a303387"`,
    );
    await queryRunner.query(`DROP TABLE "vehicle_services"`);
  }
}
