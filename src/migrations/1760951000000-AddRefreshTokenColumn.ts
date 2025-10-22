import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRefreshTokenColumn1760951000000 implements MigrationInterface {
  name = 'AddRefreshTokenColumn1760951000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "refreshToken" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
  }
}
