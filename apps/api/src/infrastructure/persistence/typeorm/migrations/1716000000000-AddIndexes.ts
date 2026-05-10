import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIndexes1716000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // List queries on the admin panel filter by these columns; the original
    // bootstrap migration only indexed the columns required by the vertical
    // slice. These are added now that the admin endpoints exist.
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_role ON users (role)`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_exam_periods_status ON exam_periods (status)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_exam_periods_status`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_role`);
  }
}
