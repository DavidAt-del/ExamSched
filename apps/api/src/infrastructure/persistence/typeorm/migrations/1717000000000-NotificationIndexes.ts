import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NotificationIndexes1717000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Re-sending the schedule for one period reads the existing log to decide
    // who's already received it; this composite covers both that lookup and
    // generic "what did we send to this user" queries.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_notification_log_user_period ON notification_log (user_id, period_id, sent_at DESC)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_notification_log_user_period`);
  }
}
