import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateLogsTable1721850000000 implements MigrationInterface {
  name = 'CreateLogsTable1721850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.createTable(
      new Table({
        name: 'logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'service',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'level',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'context',
            type: 'varchar',
            length: '150',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create Indexes for optimized query performance
    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_LOGS_SERVICE',
        columnNames: ['service'],
      }),
    );

    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_LOGS_LEVEL',
        columnNames: ['level'],
      }),
    );

    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_LOGS_CREATED_AT',
        columnNames: ['createdAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('logs', 'IDX_LOGS_CREATED_AT');
    await queryRunner.dropIndex('logs', 'IDX_LOGS_LEVEL');
    await queryRunner.dropIndex('logs', 'IDX_LOGS_SERVICE');
    await queryRunner.dropTable('logs');
  }
}
