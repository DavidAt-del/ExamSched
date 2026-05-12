import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ExamCategory1719000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE exam_category AS ENUM ('standard','special_needs','oral')`,
    );
    // NOT NULL + DEFAULT backfills existing rows in one statement.
    await queryRunner.query(
      `ALTER TABLE exams ADD COLUMN category exam_category NOT NULL DEFAULT 'standard'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE exams DROP COLUMN IF EXISTS category`);
    await queryRunner.query(`DROP TYPE IF EXISTS exam_category`);
  }
}
