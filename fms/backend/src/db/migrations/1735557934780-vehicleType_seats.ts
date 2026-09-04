import { MigrationInterface, QueryRunner } from "typeorm";

export class VehicleTypeSeats1735557934780 implements MigrationInterface {
    name = 'VehicleTypeSeats1735557934780'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_types" DROP COLUMN "number_of_seats"`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ADD "number_of_seats" integer`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "vehicle_types" DROP COLUMN "number_of_seats"`);
        await queryRunner.query(`ALTER TABLE "vehicle_types" ADD "number_of_seats" text`);
    }

}
