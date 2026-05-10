import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1715000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`CREATE TYPE user_role AS ENUM ('admin','exam_staff','proctor')`);
    await queryRunner.query(`CREATE TYPE proctor_type AS ENUM ('opener','regular')`);
    await queryRunner.query(
      `CREATE TYPE exam_period_status AS ENUM ('open','closed','scheduled','sent')`,
    );
    await queryRunner.query(`CREATE TYPE notification_channel AS ENUM ('email','sms')`);
    await queryRunner.query(`CREATE TYPE notification_status AS ENUM ('pending','sent','failed')`);

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        national_id text NOT NULL,
        first_name text NOT NULL,
        last_name text NOT NULL,
        phone text,
        email text,
        password_hash text NOT NULL,
        role user_role NOT NULL,
        proctor_type proctor_type,
        must_change_password boolean NOT NULL DEFAULT true,
        active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_users_proctor_type
          CHECK ((role = 'proctor' AND proctor_type IS NOT NULL)
              OR (role <> 'proctor' AND proctor_type IS NULL))
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX uq_users_national_id ON users (national_id)`);

    await queryRunner.query(`
      CREATE TABLE exam_periods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        deadline timestamptz NOT NULL,
        status exam_period_status NOT NULL DEFAULT 'open',
        created_by uuid NOT NULL REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE exams (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        period_id uuid NOT NULL REFERENCES exam_periods(id) ON DELETE CASCADE,
        exam_date date NOT NULL,
        start_time time NOT NULL,
        end_time time NOT NULL,
        classroom_count int NOT NULL CHECK (classroom_count > 0),
        CONSTRAINT chk_exams_time_order CHECK (start_time < end_time)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_exams_period ON exams (period_id)`);

    await queryRunner.query(`
      CREATE TABLE availabilities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        available boolean NOT NULL,
        submitted_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_availabilities_user_exam UNIQUE (user_id, exam_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_availabilities_exam ON availabilities (exam_id)`);
    await queryRunner.query(`CREATE INDEX idx_availabilities_user ON availabilities (user_id)`);

    await queryRunner.query(`
      CREATE TABLE assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id uuid NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        classroom_index int NOT NULL,
        opener_user_id uuid NOT NULL REFERENCES users(id),
        regular_user_id uuid REFERENCES users(id),
        manual_override boolean NOT NULL DEFAULT false,
        notes text,
        CONSTRAINT uq_assignments_exam_classroom UNIQUE (exam_id, classroom_index),
        CONSTRAINT chk_assignments_opener CHECK (opener_user_id IS NOT NULL)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_assignments_exam ON assignments (exam_id)`);

    await queryRunner.query(`
      CREATE TABLE notification_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        period_id uuid NOT NULL REFERENCES exam_periods(id) ON DELETE CASCADE,
        channel notification_channel NOT NULL,
        status notification_status NOT NULL,
        error text,
        sent_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audit_log (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id uuid REFERENCES users(id),
        action text NOT NULL,
        target_type text,
        target_id text,
        payload jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_audit_log_created_at ON audit_log (created_at DESC)`);
    await queryRunner.query(`CREATE INDEX idx_audit_log_actor ON audit_log (actor_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS audit_log`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_log`);
    await queryRunner.query(`DROP TABLE IF EXISTS assignments`);
    await queryRunner.query(`DROP TABLE IF EXISTS availabilities`);
    await queryRunner.query(`DROP TABLE IF EXISTS exams`);
    await queryRunner.query(`DROP TABLE IF EXISTS exam_periods`);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_channel`);
    await queryRunner.query(`DROP TYPE IF EXISTS exam_period_status`);
    await queryRunner.query(`DROP TYPE IF EXISTS proctor_type`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role`);
  }
}
