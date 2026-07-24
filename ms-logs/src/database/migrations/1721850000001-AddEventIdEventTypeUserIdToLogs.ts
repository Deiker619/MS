import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddEventIdEventTypeUserIdToLogs1721850000001 implements MigrationInterface {
  name = 'AddEventIdEventTypeUserIdToLogs1721850000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('logs', [
      new TableColumn({
        name: 'eventId',
        type: 'varchar',
        length: '100',
        isNullable: true,
      }),
      new TableColumn({
        name: 'eventType',
        type: 'varchar',
        length: '150',
        isNullable: true,
      }),
      new TableColumn({
        name: 'userId',
        type: 'varchar',
        length: '150',
        isNullable: true,
      }),
    ]);

    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_LOGS_EVENT_ID',
        columnNames: ['eventId'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'logs',
      new TableIndex({
        name: 'IDX_LOGS_EVENT_TYPE',
        columnNames: ['eventType'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('logs', 'IDX_LOGS_EVENT_TYPE');
    await queryRunner.dropIndex('logs', 'IDX_LOGS_EVENT_ID');
    await queryRunner.dropColumn('logs', 'userId');
    await queryRunner.dropColumn('logs', 'eventType');
    await queryRunner.dropColumn('logs', 'eventId');
  }
}
