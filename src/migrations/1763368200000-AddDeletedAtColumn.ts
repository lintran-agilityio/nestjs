import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Migration to add deleted_at column to all tables that extend BaseEntity
 * This enables soft delete functionality for users, posts, comments, and audit_logs
 */
export class AddDeletedAtColumn1763368200000 implements MigrationInterface {
  name = 'AddDeletedAtColumn1763368200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add deleted_at column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add deleted_at column to posts table
    await queryRunner.addColumn(
      'posts',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add deleted_at column to comments table
    await queryRunner.addColumn(
      'comments',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );

    // Add deleted_at column to audit_logs table
    await queryRunner.addColumn(
      'audit_logs',
      new TableColumn({
        name: 'deleted_at',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove deleted_at column from audit_logs table
    await queryRunner.dropColumn('audit_logs', 'deleted_at');

    // Remove deleted_at column from comments table
    await queryRunner.dropColumn('comments', 'deleted_at');

    // Remove deleted_at column from posts table
    await queryRunner.dropColumn('posts', 'deleted_at');

    // Remove deleted_at column from users table
    await queryRunner.dropColumn('users', 'deleted_at');
  }
}

