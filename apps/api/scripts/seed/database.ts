import bcrypt from 'bcrypt';
import type { Client } from 'pg';
import type { SeedDataset } from './types.js';

/**
 * Removes previously seeded demo data so the next seed run starts from a clean,
 * deterministic state.
 */
export async function truncateSeedData(client: Client): Promise<void> {
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
}

/**
 * Inserts a fully materialized dataset into PostgreSQL.
 */
export async function seedDatabase(
  client: Client,
  dataset: SeedDataset,
  bcryptCost = 4,
): Promise<void> {
  for (const user of dataset.users) {
    const hash = await bcrypt.hash(user.password, bcryptCost);
    await client.query(
      `INSERT INTO users
         (id, national_id, first_name, last_name, phone, email,
          password_hash, role, proctor_type, must_change_password, active,
          created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        user.id,
        user.nationalId,
        user.firstName,
        user.lastName,
        user.phone,
        user.email,
        hash,
        user.role,
        user.proctorType,
        user.mustChangePassword,
        user.active,
        user.createdAt,
        user.updatedAt,
      ],
    );
  }

  for (const period of dataset.periods) {
    await client.query(
      `INSERT INTO exam_periods (id, name, deadline, status, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        period.id,
        period.name,
        period.deadline,
        period.status,
        period.createdBy,
        period.createdAt,
        period.updatedAt,
      ],
    );
  }

  for (const exam of dataset.exams) {
    await client.query(
      `INSERT INTO exams (id, period_id, exam_date, start_time, end_time, classroom_count, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        exam.id,
        exam.periodId,
        exam.examDate,
        exam.startTime,
        exam.endTime,
        exam.classroomCount,
        exam.category,
      ],
    );
  }

  for (const submission of dataset.availabilitySubmissions) {
    await client.query(
      `INSERT INTO availability_submissions (id, user_id, period_id, submitted_at)
       VALUES ($1, $2, $3, $4)`,
      [submission.id, submission.userId, submission.periodId, submission.submittedAt],
    );
  }

  for (const availability of dataset.availabilities) {
    await client.query(
      `INSERT INTO availabilities (id, user_id, exam_id, available, submitted_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        availability.id,
        availability.userId,
        availability.examId,
        availability.available,
        availability.submittedAt,
      ],
    );
  }

  for (const assignment of dataset.assignments) {
    await client.query(
      `INSERT INTO assignments
         (id, exam_id, classroom_index, opener_user_id, regular_user_id, manual_override, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        assignment.id,
        assignment.examId,
        assignment.classroomIndex,
        assignment.openerUserId,
        assignment.regularUserId,
        assignment.manualOverride,
        assignment.notes,
      ],
    );
  }

  for (const row of dataset.notificationLog) {
    await client.query(
      `INSERT INTO notification_log
         (id, user_id, period_id, channel, status, error, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [row.id, row.userId, row.periodId, row.channel, row.status, row.error, row.sentAt],
    );
  }

  for (const row of dataset.auditLog) {
    await client.query(
      `INSERT INTO audit_log
         (id, actor_id, action, target_type, target_id, payload, created_at)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        row.id,
        row.actorId,
        row.action,
        row.targetType,
        row.targetId,
        row.payload ? JSON.stringify(row.payload) : null,
        row.createdAt,
      ],
    );
  }
}

/**
 * Produces a compact operator-facing summary of the seeded dataset.
 */
export function formatSeedSummary(dataset: SeedDataset): string {
  const lines = [
    '✅ Demo database seeded successfully.',
    '',
    `Profile: ${dataset.options.profile}`,
    `Seed: ${dataset.options.seed}`,
    `Users: ${dataset.users.length}`,
    `Periods: ${dataset.periods.length}`,
    `Exams: ${dataset.exams.length}`,
    `Assignments: ${dataset.assignments.length}`,
    '',
    'Login details',
    '─────────────',
    ...dataset.loginHints.map((hint) => {
      const suffix = hint.note ? ` ← ${hint.note}` : '';
      return `${hint.label.padEnd(16)} ${hint.nationalId} / ${hint.password}${suffix}`;
    }),
    '',
    'App: http://localhost:5173',
    'API: http://localhost:8080',
  ];

  return `\n${lines.join('\n')}\n`;
}

