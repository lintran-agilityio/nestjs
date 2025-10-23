import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePasswordLength1761150175486 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password" TYPE VARCHAR(255)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users"
      ALTER COLUMN "password" TYPE VARCHAR(100)
    `);
  }
}
