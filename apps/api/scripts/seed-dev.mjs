import bcrypt from 'bcrypt';
import { Client } from 'pg';

const USERS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nationalId: '000000018',
    firstName: 'Admin',
    lastName: 'Root',
    phone: null,
    email: 'admin@example.test',
    password: 'Admin1!23',
    role: 'admin',
    proctorType: null,
    mustChangePassword: false,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nationalId: '000000026',
    firstName: 'Staff',
    lastName: 'Member',
    phone: null,
    email: 'staff@example.test',
    password: 'Staff1!23',
    role: 'exam_staff',
    proctorType: null,
    mustChangePassword: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nationalId: '000000034',
    firstName: 'Dana',
    lastName: 'Cohen',
    phone: null,
    email: 'dana@example.test',
    password: '123456',
    role: 'proctor',
    proctorType: 'opener',
    mustChangePassword: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nationalId: '000000042',
    firstName: 'Yossi',
    lastName: 'Levi',
    phone: null,
    email: 'yossi@example.test',
    password: 'Pass1!23',
    role: 'proctor',
    proctorType: 'regular',
    mustChangePassword: false,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    nationalId: '000000050',
    firstName: 'Noa',
    lastName: 'Ben-David',
    phone: null,
    email: 'noa@example.test',
    password: 'Noa1!23',
    role: 'proctor',
    proctorType: 'opener',
    mustChangePassword: false,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    nationalId: '000000068',
    firstName: 'Amir',
    lastName: 'Katz',
    phone: null,
    email: 'amir@example.test',
    password: 'Amir1!23',
    role: 'proctor',
    proctorType: 'regular',
    mustChangePassword: false,
  },
];

const NOW = new Date();
const addDays = (days) => {
  const d = new Date(NOW);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};
const addHours = (days, hours, minutes = 0) => {
  const d = new Date(NOW);
  d.setHours(hours, minutes, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
};
const dateOnly = (days) => addDays(days).toISOString().slice(0, 10);

const PERIODS = {
  open: {
    id: '77777777-7777-7777-7777-777777777777',
    name: 'Fall 2026 Theory Exams',
    deadline: addDays(24),
    status: 'open',
    createdBy: USERS[0].id,
  },
  scheduled: {
    id: '88888888-8888-8888-8888-888888888888',
    name: 'Spring 2026 Retake Block',
    deadline: addDays(-2),
    status: 'scheduled',
    createdBy: USERS[0].id,
  },
  sent: {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'Summer 2025 Final Appeals',
    deadline: addDays(-35),
    status: 'sent',
    createdBy: USERS[0].id,
  },
  closed: {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    name: 'Winter 2025 Archive',
    deadline: addDays(-90),
    status: 'closed',
    createdBy: USERS[0].id,
  },
};

const EXAMS = [
  { id: 'b1111111-1111-1111-1111-111111111111', periodId: PERIODS.open.id, examDate: dateOnly(7), startTime: '08:30:00', endTime: '11:00:00', classroomCount: 2 },
  { id: 'b2222222-2222-2222-2222-222222222222', periodId: PERIODS.open.id, examDate: dateOnly(10), startTime: '11:30:00', endTime: '13:00:00', classroomCount: 3 },
  { id: 'b3333333-3333-3333-3333-333333333333', periodId: PERIODS.open.id, examDate: dateOnly(13), startTime: '14:00:00', endTime: '16:00:00', classroomCount: 2 },
  { id: 'c1111111-1111-1111-1111-111111111111', periodId: PERIODS.scheduled.id, examDate: dateOnly(1), startTime: '09:00:00', endTime: '11:30:00', classroomCount: 3 },
  { id: 'c2222222-2222-2222-2222-222222222222', periodId: PERIODS.scheduled.id, examDate: dateOnly(3), startTime: '12:00:00', endTime: '14:00:00', classroomCount: 2 },
  { id: 'd1111111-1111-1111-1111-111111111111', periodId: PERIODS.sent.id, examDate: dateOnly(5), startTime: '10:00:00', endTime: '12:30:00', classroomCount: 2 },
  { id: 'e1111111-1111-1111-1111-111111111111', periodId: PERIODS.closed.id, examDate: dateOnly(-14), startTime: '09:00:00', endTime: '12:00:00', classroomCount: 1 },
];

const AVAILABILITY_SUBMISSIONS = [
  { id: 'f1111111-1111-1111-1111-111111111111', userId: USERS[2].id, periodId: PERIODS.open.id, submittedAt: addHours(-1, 16, 30) },
  { id: 'f2222222-2222-2222-2222-222222222222', userId: USERS[3].id, periodId: PERIODS.open.id, submittedAt: addHours(-1, 16, 45) },
  { id: 'f3333333-3333-3333-3333-333333333333', userId: USERS[4].id, periodId: PERIODS.open.id, submittedAt: addHours(-1, 17, 0) },
  { id: 'f4444444-4444-4444-4444-444444444444', userId: USERS[5].id, periodId: PERIODS.open.id, submittedAt: addHours(-1, 17, 15) },
];

const AVAILABILITIES = [
  { id: 'a1111111-1111-1111-1111-111111111111', userId: USERS[2].id, examId: EXAMS[0].id, available: true, submittedAt: AVAILABILITY_SUBMISSIONS[0].submittedAt },
  { id: 'a2222222-2222-2222-2222-222222222222', userId: USERS[2].id, examId: EXAMS[1].id, available: false, submittedAt: AVAILABILITY_SUBMISSIONS[0].submittedAt },
  { id: 'a3333333-3333-3333-3333-333333333333', userId: USERS[3].id, examId: EXAMS[0].id, available: true, submittedAt: AVAILABILITY_SUBMISSIONS[1].submittedAt },
  { id: 'a4444444-4444-4444-4444-444444444444', userId: USERS[3].id, examId: EXAMS[1].id, available: true, submittedAt: AVAILABILITY_SUBMISSIONS[1].submittedAt },
  { id: 'a5555555-5555-5555-5555-555555555555', userId: USERS[3].id, examId: EXAMS[2].id, available: false, submittedAt: AVAILABILITY_SUBMISSIONS[1].submittedAt },
  { id: 'a6666666-6666-6666-6666-666666666666', userId: USERS[4].id, examId: EXAMS[0].id, available: false, submittedAt: AVAILABILITY_SUBMISSIONS[2].submittedAt },
  { id: 'a7777777-7777-7777-7777-777777777777', userId: USERS[4].id, examId: EXAMS[1].id, available: true, submittedAt: AVAILABILITY_SUBMISSIONS[2].submittedAt },
  { id: 'a8888888-8888-8888-8888-888888888888', userId: USERS[4].id, examId: EXAMS[2].id, available: true, submittedAt: AVAILABILITY_SUBMISSIONS[2].submittedAt },
  { id: 'a9999999-9999-9999-9999-999999999999', userId: USERS[5].id, examId: EXAMS[0].id, available: true, submittedAt: AVAILABILITY_SUBMISSIONS[3].submittedAt },
  { id: 'ab111111-1111-1111-1111-111111111111', userId: USERS[5].id, examId: EXAMS[2].id, available: false, submittedAt: AVAILABILITY_SUBMISSIONS[3].submittedAt },
];

const ASSIGNMENTS = [
  { id: 'b4444444-4444-4444-4444-444444444444', examId: EXAMS[3].id, classroomIndex: 1, openerUserId: USERS[2].id, regularUserId: USERS[3].id, manualOverride: false, notes: null },
  { id: 'b5555555-5555-5555-5555-555555555555', examId: EXAMS[3].id, classroomIndex: 2, openerUserId: USERS[4].id, regularUserId: USERS[5].id, manualOverride: true, notes: 'Kept together due to accessibility accommodations.' },
  { id: 'b6666666-6666-6666-6666-666666666666', examId: EXAMS[3].id, classroomIndex: 3, openerUserId: USERS[2].id, regularUserId: USERS[5].id, manualOverride: false, notes: null },
  { id: 'b7777777-7777-7777-7777-777777777777', examId: EXAMS[4].id, classroomIndex: 1, openerUserId: USERS[4].id, regularUserId: USERS[3].id, manualOverride: false, notes: null },
  { id: 'b8888888-8888-8888-8888-888888888888', examId: EXAMS[4].id, classroomIndex: 2, openerUserId: USERS[2].id, regularUserId: USERS[5].id, manualOverride: false, notes: null },
  { id: 'b9999999-9999-9999-9999-999999999999', examId: EXAMS[5].id, classroomIndex: 1, openerUserId: USERS[2].id, regularUserId: USERS[3].id, manualOverride: false, notes: null },
  { id: 'ba111111-1111-1111-1111-111111111111', examId: EXAMS[5].id, classroomIndex: 2, openerUserId: USERS[4].id, regularUserId: USERS[5].id, manualOverride: false, notes: null },
];

const NOTIFICATION_LOG = [
  { id: 'c1111111-1111-1111-1111-111111111111', userId: USERS[2].id, periodId: PERIODS.sent.id, channel: 'email', status: 'sent', error: null, sentAt: addHours(-1, 18, 10) },
  { id: 'c2222222-2222-2222-2222-222222222222', userId: USERS[3].id, periodId: PERIODS.sent.id, channel: 'email', status: 'sent', error: null, sentAt: addHours(-1, 18, 12) },
  { id: 'c3333333-3333-3333-3333-333333333333', userId: USERS[4].id, periodId: PERIODS.sent.id, channel: 'email', status: 'sent', error: null, sentAt: addHours(-1, 18, 14) },
  { id: 'c4444444-4444-4444-4444-444444444444', userId: USERS[5].id, periodId: PERIODS.sent.id, channel: 'email', status: 'failed', error: 'Transient SMTP timeout', sentAt: null },
];

const AUDIT_LOG = [
  { id: 'd1111111-1111-1111-1111-111111111111', actorId: USERS[0].id, action: 'seed_demo_users', targetType: 'user', targetId: USERS[2].id, payload: { count: USERS.length }, createdAt: addDays(-2) },
  { id: 'd2222222-2222-2222-2222-222222222222', actorId: USERS[0].id, action: 'seed_demo_period', targetType: 'exam_period', targetId: PERIODS.open.id, payload: { status: PERIODS.open.status, exams: 3 }, createdAt: addDays(-2) },
  { id: 'd3333333-3333-3333-3333-333333333333', actorId: USERS[2].id, action: 'submit_availability', targetType: 'exam_period', targetId: PERIODS.open.id, payload: { exams: [EXAMS[0].id, EXAMS[1].id] }, createdAt: AVAILABILITY_SUBMISSIONS[0].submittedAt },
  { id: 'd4444444-4444-4444-4444-444444444444', actorId: USERS[3].id, action: 'submit_availability', targetType: 'exam_period', targetId: PERIODS.open.id, payload: { exams: [EXAMS[0].id, EXAMS[1].id, EXAMS[2].id] }, createdAt: AVAILABILITY_SUBMISSIONS[1].submittedAt },
  { id: 'd5555555-5555-5555-5555-555555555555', actorId: USERS[0].id, action: 'run_scheduler', targetType: 'exam_period', targetId: PERIODS.scheduled.id, payload: { assignments: 5, manualOverrides: 1 }, createdAt: addHours(-1, 15, 0) },
  { id: 'd6666666-6666-6666-6666-666666666666', actorId: USERS[0].id, action: 'send_schedules', targetType: 'exam_period', targetId: PERIODS.sent.id, payload: { notifications: 4 }, createdAt: addHours(-1, 18, 0) },
  { id: 'd7777777-7777-7777-7777-777777777777', actorId: USERS[0].id, action: 'close_exam_period', targetType: 'exam_period', targetId: PERIODS.closed.id, payload: { status: 'closed' }, createdAt: addDays(-1) },
];

async function main() {
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'app',
    password: process.env.DB_PASSWORD ?? 'app',
    database: process.env.DB_NAME ?? 'proctor_scheduler',
  });

  await client.connect();

  try {
    console.log('🗑  Truncating existing demo data...');
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

    console.log('👤 Seeding users...');
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 4);
      await client.query(
        `INSERT INTO users
           (id, national_id, first_name, last_name, phone, email,
            password_hash, role, proctor_type, must_change_password, active,
            created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,now(),now())`,
        [u.id, u.nationalId, u.firstName, u.lastName, u.phone, u.email, hash, u.role, u.proctorType, u.mustChangePassword],
      );
      console.log(`   ✓ ${String(u.role).padEnd(10)} ${u.firstName} ${u.lastName}  (${u.nationalId} / ${u.password})`);
    }

    console.log('📅 Seeding exam periods...');
    for (const period of Object.values(PERIODS)) {
      await client.query(
        `INSERT INTO exam_periods (id, name, deadline, status, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $6)`,
        [period.id, period.name, period.deadline, period.status, period.createdBy, addDays(-2)],
      );
    }

    console.log('📝 Seeding exams...');
    for (const exam of EXAMS) {
      await client.query(
        `INSERT INTO exams (id, period_id, exam_date, start_time, end_time, classroom_count)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [exam.id, exam.periodId, exam.examDate, exam.startTime, exam.endTime, exam.classroomCount],
      );
    }

    console.log('📊 Seeding availability submissions...');
    for (const submission of AVAILABILITY_SUBMISSIONS) {
      await client.query(
        `INSERT INTO availability_submissions (id, user_id, period_id, submitted_at)
         VALUES ($1, $2, $3, $4)`,
        [submission.id, submission.userId, submission.periodId, submission.submittedAt],
      );
    }

    console.log('✅ Seeding availability answers...');
    for (const availability of AVAILABILITIES) {
      await client.query(
        `INSERT INTO availabilities (id, user_id, exam_id, available, submitted_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [availability.id, availability.userId, availability.examId, availability.available, availability.submittedAt],
      );
    }

    console.log('🧩 Seeding assignments...');
    for (const assignment of ASSIGNMENTS) {
      await client.query(
        `INSERT INTO assignments
           (id, exam_id, classroom_index, opener_user_id, regular_user_id, manual_override, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [assignment.id, assignment.examId, assignment.classroomIndex, assignment.openerUserId, assignment.regularUserId, assignment.manualOverride, assignment.notes],
      );
    }

    console.log('📨 Seeding notification logs...');
    for (const row of NOTIFICATION_LOG) {
      await client.query(
        `INSERT INTO notification_log
           (id, user_id, period_id, channel, status, error, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [row.id, row.userId, row.periodId, row.channel, row.status, row.error, row.sentAt],
      );
    }

    console.log('🧾 Seeding audit logs...');
    for (const row of AUDIT_LOG) {
      await client.query(
        `INSERT INTO audit_log
           (id, actor_id, action, target_type, target_id, payload, created_at)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7)`,
        [row.id, row.actorId, row.action, row.targetType, row.targetId, JSON.stringify(row.payload), row.createdAt],
      );
    }

    console.log(`
✅  Rich demo database seeded!

   Login details
   ─────────────
   Admin        000000018 / Admin1!23
   Exam Staff   000000026 / Staff1!23
   Proctor      000000034 / 123456      ← must change password on first login
   Proctor      000000042 / Pass1!23
   Proctor      000000050 / Noa1!23
   Proctor      000000068 / Amir1!23

   What you can demo now
   ─────────────────────
   • Admin audit log with a seeded activity trail
   • Proctor availability calendar with open / unavailable / not-chosen states
   • Scheduled exam assignments already in place
   • Sent-period notification history

   App: http://localhost:5173
   API: http://localhost:8080
`);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

