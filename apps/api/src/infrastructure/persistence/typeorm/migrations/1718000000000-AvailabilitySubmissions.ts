import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AvailabilitySubmissions1718000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Records the moment a proctor explicitly submits ("שלח") their final
    // availability for a period. Distinct from `availabilities.submitted_at`,
    // which reflects only the latest per-exam toggle.
    await queryRunner.query(`
      CREATE TABLE availability_submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        period_id uuid NOT NULL REFERENCES exam_periods(id) ON DELETE CASCADE,
        submitted_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_availability_submissions_user_period UNIQUE (user_id, period_id)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_availability_submissions_period ON availability_submissions (period_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_availability_submissions_user ON availability_submissions (user_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS availability_submissions`);
  }
}
