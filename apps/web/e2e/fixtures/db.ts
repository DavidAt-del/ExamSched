/**
 * Minimal Postgres helpers for specs that need to mutate seed state. The
 * connection settings mirror `global-setup.ts`; we re-create a Client per
 * call rather than holding one open because Playwright sometimes runs the
 * teardown after the test process is already detaching from the worker.
 */
import bcrypt from 'bcrypt';
import { Client } from 'pg';

function makeClient(): Client {
  return new Client({
    host: process.env.E2E_DB_HOST ?? 'localhost',
    port: Number(process.env.E2E_DB_PORT ?? 5432),
    user: process.env.E2E_DB_USER ?? 'app',
    password: process.env.E2E_DB_PASSWORD ?? 'app',
    database: process.env.E2E_DB_NAME ?? 'proctor_scheduler',
  });
}

/**
 * Reset a user's password + mustChangePassword flag. Used by the forced-
 * change-password spec so a successful run leaves the same user in the
 * first-login state for the next test or run.
 */
export async function resetUserPassword(
  userId: string,
  plaintext: string,
  mustChange: boolean,
): Promise<void> {
  const hash = await bcrypt.hash(plaintext, 4);
  const client = makeClient();
  await client.connect();
  try {
    await client.query(
      `UPDATE users SET password_hash = $1, must_change_password = $2, updated_at = now() WHERE id = $3`,
      [hash, mustChange, userId],
    );
  } finally {
    await client.end();
  }
}

/**
 * Drop all availability + assignment + submission state for a period, so
 * scheduler-related specs start from a known baseline without re-running
 * global setup.
 */
export async function clearPeriodState(periodId: string): Promise<void> {
  const client = makeClient();
  await client.connect();
  try {
    await client.query(
      `DELETE FROM notification_log WHERE period_id = $1`,
      [periodId],
    );
    await client.query(
      `DELETE FROM availability_submissions WHERE period_id = $1`,
      [periodId],
    );
    await client.query(
      `DELETE FROM availabilities WHERE exam_id IN (SELECT id FROM exams WHERE period_id = $1)`,
      [periodId],
    );
    await client.query(
      `DELETE FROM assignments WHERE exam_id IN (SELECT id FROM exams WHERE period_id = $1)`,
      [periodId],
    );
    await client.query(
      `UPDATE exam_periods SET status = 'open' WHERE id = $1`,
      [periodId],
    );
  } finally {
    await client.end();
  }
}
