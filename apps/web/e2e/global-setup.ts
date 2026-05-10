/**
 * Playwright global setup. Idempotently seeds the database with the fixtures
 * every spec depends on:
 *   - 1 admin (national_id 000000018, password "Admin1!23")
 *   - 1 exam-staff (national_id 000000026, password "Staff1!23")
 *   - 1 opener proctor (000000034, "123456", mustChangePassword=true)
 *   - 1 regular proctor (000000042, "Pass1!23", mustChangePassword=false)
 *   - 1 open exam period named "E2E Period" with deadline 30 days out
 *   - 1 exam in that period (classroomCount=2)
 *
 * We hit Postgres directly so this runs before any API call needs to know
 * who exists. Tests reference these credentials by exporting them from
 * `e2e/fixtures/users.ts`.
 *
 * Run with: `npm run test:e2e --workspace @app/web`
 *
 * Required env (defaults match docker-compose.yml):
 *   E2E_DB_HOST, E2E_DB_PORT, E2E_DB_USER, E2E_DB_PASSWORD, E2E_DB_NAME
 */
import bcrypt from 'bcrypt';
import { Client } from 'pg';
import { TEST_USERS, TEST_PERIOD, TEST_EXAM } from './fixtures/users';

async function main(): Promise<void> {
  const client = new Client({
    host: process.env.E2E_DB_HOST ?? 'localhost',
    port: Number(process.env.E2E_DB_PORT ?? 5432),
    user: process.env.E2E_DB_USER ?? 'app',
    password: process.env.E2E_DB_PASSWORD ?? 'app',
    database: process.env.E2E_DB_NAME ?? 'proctor_scheduler',
  });
  await client.connect();
  try {
    // Wipe everything every run so the spec set is deterministic. Cascades
    // handle the FK fanout from users → assignments / availabilities / etc.
    await client.query(`
      TRUNCATE TABLE
        notification_log,
        availability_submissions,
        availabilities,
        assignments,
        exams,
        exam_periods,
        audit_log,
        users
      RESTART IDENTITY CASCADE
    `);

    for (const u of TEST_USERS) {
      const hash = await bcrypt.hash(u.password, 4); // low cost — test only
      await client.query(
        `
        INSERT INTO users (
          id, national_id, first_name, last_name, phone, email,
          password_hash, role, proctor_type, must_change_password, active,
          created_at, updated_at
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,now(),now())
      `,
        [
          u.id,
          u.nationalId,
          u.firstName,
          u.lastName,
          u.phone,
          u.email,
          hash,
          u.role,
          u.proctorType,
          u.mustChangePassword,
        ],
      );
    }

    await client.query(
      `
      INSERT INTO exam_periods (id, name, deadline, status, created_by, created_at, updated_at)
      VALUES ($1, $2, $3, 'open', $4, now(), now())
    `,
      [TEST_PERIOD.id, TEST_PERIOD.name, TEST_PERIOD.deadline, TEST_PERIOD.createdBy],
    );

    await client.query(
      `
      INSERT INTO exams (id, period_id, exam_date, start_time, end_time, classroom_count)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
      [
        TEST_EXAM.id,
        TEST_EXAM.periodId,
        TEST_EXAM.examDate,
        TEST_EXAM.startTime,
        TEST_EXAM.endTime,
        TEST_EXAM.classroomCount,
      ],
    );
  } finally {
    await client.end();
  }
}

export default main;
