import { MigrationInterface, QueryRunner } from 'typeorm';

export class Expenses1735561136196 implements MigrationInterface {
  name = 'Expenses1735561136196';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "expenses" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE, "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" text, "amount" double precision, "date" TIMESTAMP WITH TIME ZONE, "receipt" text, "note" text, "vehicle_id" uuid, CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "expenses" ADD CONSTRAINT "FK_5fc8d9c2e4f6105eb9ccbae8f38" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "expenses" DROP CONSTRAINT "FK_5fc8d9c2e4f6105eb9ccbae8f38"`,
    );
    await queryRunner.query(`DROP TABLE "expenses"`);
  }
}
