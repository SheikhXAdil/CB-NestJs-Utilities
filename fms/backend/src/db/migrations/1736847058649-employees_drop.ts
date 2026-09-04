import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmployeesDrop1736847058649 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_roles" DROP CONSTRAINT IF EXISTS "FK_13f42debabcdc155b21632097cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_roles" DROP CONSTRAINT IF EXISTS "FK_04aafdf0252f05451916c4810ec"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_13f42debabcdc155b21632097c"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_04aafdf0252f05451916c4810e"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "employee_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
