import { MigrationInterface, QueryRunner } from 'typeorm';

export class UserEmployees1732618692772 implements MigrationInterface {
  name = 'UserEmployees1732618692772';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "employees" ("created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "deleted_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "is_deleted" boolean NOT NULL DEFAULT false, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text, "password" text, "phone_number" text, "name" text, "password_reset_token" text, "last_login_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_b9535a98350d5b26e7eb0c26af4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "employee_roles" ("employee_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_8bf7f2fbc9039751cd34d9f9606" PRIMARY KEY ("employee_id", "role_id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_04aafdf0252f05451916c4810e" ON "employee_roles" ("employee_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_13f42debabcdc155b21632097c" ON "employee_roles" ("role_id") `,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_roles" ADD CONSTRAINT "FK_04aafdf0252f05451916c4810ec" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_roles" ADD CONSTRAINT "FK_13f42debabcdc155b21632097cf" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "employee_roles" DROP CONSTRAINT "FK_13f42debabcdc155b21632097cf"`,
    );
    await queryRunner.query(
      `ALTER TABLE "employee_roles" DROP CONSTRAINT "FK_04aafdf0252f05451916c4810ec"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_13f42debabcdc155b21632097c"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_04aafdf0252f05451916c4810e"`,
    );
    await queryRunner.query(`DROP TABLE "employee_roles"`);
    await queryRunner.query(`DROP TABLE "employees"`);
  }
}
