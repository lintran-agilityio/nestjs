import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Migration to create the comments table
 * Includes foreign key relationships to users and posts
 */
export class CreateCommentsTable1761151000000 implements MigrationInterface {
  name = 'CreateCommentsTable1761151000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'comments',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'post_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create foreign key to users table
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'CASCADE',
      }),
    );

    // Create foreign key to posts table
    await queryRunner.createForeignKey(
      'comments',
      new TableForeignKey({
        columnNames: ['post_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'posts',
        onDelete: 'CASCADE',
      }),
    );

    // Create index on user_id for better query performance
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comments_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create index on post_id for better query performance
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comments_post_id',
        columnNames: ['post_id'],
      }),
    );

    // Create index on created_at for sorting
    await queryRunner.createIndex(
      'comments',
      new TableIndex({
        name: 'IDX_comments_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.dropIndex('comments', 'IDX_comments_created_at');
    await queryRunner.dropIndex('comments', 'IDX_comments_post_id');
    await queryRunner.dropIndex('comments', 'IDX_comments_user_id');

    // Drop foreign keys and table
    const commentsTable = await queryRunner.getTable('comments');
    if (commentsTable) {
      const foreignKeyUserId = commentsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('user_id') !== -1,
      );
      const foreignKeyPostId = commentsTable.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('post_id') !== -1,
      );

      if (foreignKeyUserId) {
        await queryRunner.dropForeignKey('comments', foreignKeyUserId);
      }
      if (foreignKeyPostId) {
        await queryRunner.dropForeignKey('comments', foreignKeyPostId);
      }
    }

    await queryRunner.dropTable('comments');
  }
}
