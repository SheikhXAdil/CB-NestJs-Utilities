import { MigrationInterface, QueryRunner } from 'typeorm';

export class EntityIds1737367942653 implements MigrationInterface {
  name = 'EntityIds1737367942653';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clients" ADD "client_id" text`);
    await queryRunner.query(`ALTER TABLE "bookings" ADD "booking_id" text`);
    await queryRunner.query(`ALTER TABLE "drivers" ADD "driver_id" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "drivers" DROP COLUMN "driver_id"`);
    await queryRunner.query(`ALTER TABLE "bookings" DROP COLUMN "booking_id"`);
    await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "client_id"`);
  }
}
