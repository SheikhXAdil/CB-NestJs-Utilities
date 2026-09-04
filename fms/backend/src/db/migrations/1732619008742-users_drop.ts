import { MigrationInterface, QueryRunner } from 'typeorm';

export class UsersDrop1732619008742 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "FK_b23c65e50a758245a33ee35fda1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_roles" DROP CONSTRAINT IF EXISTS "FK_87b8888186ca9769c960e926870"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_b23c65e50a758245a33ee35fda"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_87b8888186ca9769c960e92687"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
