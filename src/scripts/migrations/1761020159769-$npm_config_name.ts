import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1761020159769 implements MigrationInterface {
    name = ' $npmConfigName1761020159769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "refreshToken" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "refreshToken"`);
    }

}
