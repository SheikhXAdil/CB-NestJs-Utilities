import { MigrationInterface, QueryRunner } from 'typeorm';

export class VehicleVehicleId1738061653730 implements MigrationInterface {
  name = 'VehicleVehicleId1738061653730';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" ADD "vehicle_id" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "vehicles" DROP COLUMN "vehicle_id"`);
  }
}
