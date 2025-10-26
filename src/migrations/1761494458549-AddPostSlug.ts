import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPostSlug1761494458549 implements MigrationInterface {
  name = 'AddPostSlug1761494458549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" ADD "slug" character varying(255) NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "posts" ADD CONSTRAINT "UQ_54ddf9075260407dcfdd7248577" UNIQUE ("slug")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "posts" DROP CONSTRAINT "UQ_54ddf9075260407dcfdd7248577"`,
    );
    await queryRunner.query(`ALTER TABLE "posts" DROP COLUMN "slug"`);
  }
}
