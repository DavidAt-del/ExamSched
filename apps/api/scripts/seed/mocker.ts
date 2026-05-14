import {
  ExamCategory,
  ExamPeriodStatus,
  NotificationChannel,
  NotificationStatus,
  ProctorType,
  UserRole,
} from '@app/shared';
import { Faker, en, he } from '@faker-js/faker';
import type {
  SeedAssignmentRecord,
  SeedAuditRecord,
  SeedAvailabilityRecord,
  SeedAvailabilitySubmissionRecord,
  SeedDataset,
  SeedExamRecord,
  SeedGenerationOptions,
  SeedLoginHint,
  SeedPeriodRecord,
  SeedProfile,
  SeedUserRecord,
} from './types.js';

const SHARED_PASSWORD = 'Pass1!23';
const DEFAULT_SEED = 20260514;
const CURATED_USERS: ReadonlyArray<Omit<SeedUserRecord, 'createdAt' | 'updatedAt'>> = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nationalId: '000000018',
    firstName: 'Admin',
    lastName: 'Root',
    phone: null,
    email: 'admin@example.test',
    password: 'Admin1!23',
    role: UserRole.Admin,
    proctorType: null,
    mustChangePassword: false,
    active: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nationalId: '000000026',
    firstName: 'Staff',
    lastName: 'Member',
    phone: null,
    email: 'staff@example.test',
    password: 'Staff1!23',
    role: UserRole.ExamStaff,
    proctorType: null,
    mustChangePassword: false,
    active: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nationalId: '000000034',
    firstName: 'Dana',
    lastName: 'Cohen',
    phone: null,
    email: 'dana@example.test',
    password: '123456',
    role: UserRole.Proctor,
    proctorType: ProctorType.Opener,
    mustChangePassword: true,
    active: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nationalId: '000000042',
    firstName: 'Yossi',
    lastName: 'Levi',
    phone: null,
    email: 'yossi@example.test',
    password: 'Pass1!23',
    role: UserRole.Proctor,
    proctorType: ProctorType.Regular,
    mustChangePassword: false,
    active: true,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    nationalId: '000000050',
    firstName: 'Noa',
    lastName: 'Ben-David',
    phone: null,
    email: 'noa@example.test',
    password: 'Noa1!23',
    role: UserRole.Proctor,
    proctorType: ProctorType.Opener,
    mustChangePassword: false,
    active: true,
  },
  {
    id: '66666666-6666-6666-6666-666666666666',
    nationalId: '000000068',
    firstName: 'Amir',
    lastName: 'Katz',
    phone: null,
    email: 'amir@example.test',
    password: 'Amir1!23',
    role: UserRole.Proctor,
    proctorType: ProctorType.Regular,
    mustChangePassword: false,
    active: true,
  },
];

const PROFILE_DEFAULTS: Readonly<Record<SeedProfile, SeedGenerationOptions>> = {
  demo: {
    profile: 'demo',
    seed: DEFAULT_SEED,
    generatedPassword: SHARED_PASSWORD,
    extraStaffCount: 0,
    extraProctorCount: 4,
    openExamCount: 3,
    scheduledExamCount: 2,
    sentExamCount: 1,
    closedExamCount: 1,
    availabilityPositiveRate: 0.62,
    notificationFailureRate: 0.12,
    manualOverrideRate: 0.18,
  },
  mocker: {
    profile: 'mocker',
    seed: DEFAULT_SEED,
    generatedPassword: SHARED_PASSWORD,
    extraStaffCount: 2,
    extraProctorCount: 18,
    openExamCount: 8,
    scheduledExamCount: 6,
    sentExamCount: 4,
    closedExamCount: 3,
    availabilityPositiveRate: 0.7,
    notificationFailureRate: 0.08,
    manualOverrideRate: 0.12,
  },
  load: {
    profile: 'load',
    seed: DEFAULT_SEED,
    generatedPassword: SHARED_PASSWORD,
    extraStaffCount: 5,
    extraProctorCount: 60,
    openExamCount: 20,
    scheduledExamCount: 16,
    sentExamCount: 12,
    closedExamCount: 8,
    availabilityPositiveRate: 0.76,
    notificationFailureRate: 0.05,
    manualOverrideRate: 0.1,
  },
};

const EXAM_TIME_SLOTS = [
  { startTime: '08:30:00', endTime: '11:00:00' },
  { startTime: '11:30:00', endTime: '13:30:00' },
  { startTime: '14:00:00', endTime: '16:30:00' },
  { startTime: '17:30:00', endTime: '20:00:00' },
] as const;

const EXAM_CATEGORIES = [
  ExamCategory.Standard,
  ExamCategory.SpecialNeeds,
  ExamCategory.Oral,
] as const;

/**
 * Returns the documented defaults for a seeding profile.
 */
export function getSeedProfileDefaults(profile: SeedProfile): SeedGenerationOptions {
  return { ...PROFILE_DEFAULTS[profile] };
}

/**
 * Merges CLI overrides into a named seeding profile.
 */
export function resolveSeedOptions(
  profile: SeedProfile,
  overrides: Partial<SeedGenerationOptions> = {},
): SeedGenerationOptions {
  return {
    ...getSeedProfileDefaults(profile),
    ...overrides,
    profile,
  };
}

/**
 * Builds a deterministic local dataset that exercises the admin, proctor, and
 * notification flows with both curated and generated actors.
 */
export function buildMockSeedDataset(options: SeedGenerationOptions): SeedDataset {
  const faker = new Faker({ locale: [he, en] });
  faker.seed(options.seed);

  const generatedAt = new Date();
  const addDays = (days: number, hour = 12, minute = 0): Date => {
    const value = new Date(generatedAt);
    value.setHours(hour, minute, 0, 0);
    value.setDate(value.getDate() + days);
    return value;
  };
  const dateOnly = (days: number): string => addDays(days).toISOString().slice(0, 10);

  const users: SeedUserRecord[] = CURATED_USERS.map((user, index) => ({
    ...user,
    createdAt: addDays(-10 + index),
    updatedAt: addDays(-2 + index),
  }));

  const adminUser = users.find((user) => user.role === UserRole.Admin)!;
  const staffUsers = users.filter((user) => user.role === UserRole.ExamStaff);
  const generatedStaff = Array.from({ length: options.extraStaffCount }, (_, index) =>
    buildGeneratedUser({
      faker,
      role: UserRole.ExamStaff,
      proctorType: null,
      nationalIdSequence: index + 1,
      password: options.generatedPassword,
      createdAt: addDays(-8 + index),
      updatedAt: addDays(-1),
    }),
  );
  const generatedProctors = Array.from({ length: options.extraProctorCount }, (_, index) =>
    buildGeneratedUser({
      faker,
      role: UserRole.Proctor,
      proctorType: index % 3 === 0 ? ProctorType.Opener : ProctorType.Regular,
      nationalIdSequence: index + 100,
      password: options.generatedPassword,
      createdAt: addDays(-7 + (index % 5)),
      updatedAt: addDays(-1),
      mustChangePassword: index % 7 === 0,
    }),
  );
  users.push(...generatedStaff, ...generatedProctors);

  const allStaff = [...staffUsers, ...generatedStaff];
  const proctors = users.filter((user) => user.role === UserRole.Proctor);
  const openers = proctors.filter((user) => user.proctorType === ProctorType.Opener);
  const regulars = proctors.filter((user) => user.proctorType === ProctorType.Regular);

  const periods: SeedPeriodRecord[] = [
    {
      id: faker.string.uuid(),
      name: 'Open Demo Period',
      deadline: addDays(18),
      status: ExamPeriodStatus.Open,
      createdBy: adminUser.id,
      createdAt: addDays(-3),
      updatedAt: addDays(-3),
    },
    {
      id: faker.string.uuid(),
      name: 'Scheduled Review Block',
      deadline: addDays(-2),
      status: ExamPeriodStatus.Scheduled,
      createdBy: adminUser.id,
      createdAt: addDays(-20),
      updatedAt: addDays(-1),
    },
    {
      id: faker.string.uuid(),
      name: 'Sent Appeals Period',
      deadline: addDays(-20),
      status: ExamPeriodStatus.Sent,
      createdBy: adminUser.id,
      createdAt: addDays(-35),
      updatedAt: addDays(-5),
    },
    {
      id: faker.string.uuid(),
      name: 'Closed Archive Period',
      deadline: addDays(-60),
      status: ExamPeriodStatus.Closed,
      createdBy: adminUser.id,
      createdAt: addDays(-80),
      updatedAt: addDays(-40),
    },
  ];

  const openPeriod = periods[0]!;
  const scheduledPeriod = periods[1]!;
  const sentPeriod = periods[2]!;
  const closedPeriod = periods[3]!;
  const exams: SeedExamRecord[] = [
    ...buildPeriodExams({
      faker,
      periodId: openPeriod.id,
      count: options.openExamCount,
      dayOffset: 5,
      dateOnly,
    }),
    ...buildPeriodExams({
      faker,
      periodId: scheduledPeriod.id,
      count: options.scheduledExamCount,
      dayOffset: 1,
      dateOnly,
    }),
    ...buildPeriodExams({
      faker,
      periodId: sentPeriod.id,
      count: options.sentExamCount,
      dayOffset: -6,
      dateOnly,
    }),
    ...buildPeriodExams({
      faker,
      periodId: closedPeriod.id,
      count: options.closedExamCount,
      dayOffset: -18,
      dateOnly,
    }),
  ];

  const openPeriodExams = exams.filter((exam) => exam.periodId === openPeriod.id);
  const availabilitySubmissions: SeedAvailabilitySubmissionRecord[] = proctors.map((proctor, index) => ({
    id: faker.string.uuid(),
    userId: proctor.id,
    periodId: openPeriod.id,
    submittedAt: addDays(-1, 15 + (index % 4), (index * 7) % 60),
  }));

  const submissionByUserId = new Map(
    availabilitySubmissions.map((submission) => [submission.userId, submission]),
  );
  const availabilities: SeedAvailabilityRecord[] = proctors.flatMap((proctor, index) =>
    openPeriodExams.map((exam, examIndex) => ({
      id: faker.string.uuid(),
      userId: proctor.id,
      examId: exam.id,
      available:
        index < 4
          ? [true, index !== 0 || examIndex === 0, index % 2 === 0].at(examIndex % 3) ?? true
          : faker.number.float({ min: 0, max: 1, fractionDigits: 2 }) <= options.availabilityPositiveRate,
      submittedAt: submissionByUserId.get(proctor.id)!.submittedAt,
    })),
  );

  const assignments: SeedAssignmentRecord[] = [];
  const assignmentNotes = [
    'Kept together to preserve accessibility accommodations.',
    'Manual override requested by exam staff after a last-minute absence.',
    'Experienced opener retained for a large multi-room exam.',
  ];
  const scheduledAndSentExams = exams.filter(
    (exam) => exam.periodId === scheduledPeriod.id || exam.periodId === sentPeriod.id,
  );
  scheduledAndSentExams.forEach((exam, examIndex) => {
    for (let classroomIndex = 1; classroomIndex <= exam.classroomCount; classroomIndex += 1) {
      const opener = openers[(examIndex + classroomIndex) % openers.length] ?? proctors[0]!;
      const regularPool = regulars.length > 0 ? regulars : proctors;
      const regularCandidate = regularPool[(examIndex * 2 + classroomIndex) % regularPool.length] ?? null;
      const isSoloRoom = exam.classroomCount === 1 && classroomIndex === 1 && examIndex % 3 === 0;
      const manualOverride =
        faker.number.float({ min: 0, max: 1, fractionDigits: 2 }) <= options.manualOverrideRate;
      assignments.push({
        id: faker.string.uuid(),
        examId: exam.id,
        classroomIndex,
        openerUserId: opener.id,
        regularUserId: isSoloRoom ? null : regularCandidate?.id ?? null,
        manualOverride,
        notes: manualOverride ? faker.helpers.arrayElement(assignmentNotes) : null,
      });
    }
  });

  const sentAssignments = assignments.filter((assignment) => {
    const exam = exams.find((candidate) => candidate.id === assignment.examId);
    return exam?.periodId === sentPeriod.id;
  });
  const notificationTargets = new Set<string>();
  sentAssignments.forEach((assignment) => {
    notificationTargets.add(assignment.openerUserId);
    if (assignment.regularUserId) {
      notificationTargets.add(assignment.regularUserId);
    }
  });
  const notificationLog = [...notificationTargets].map((userId, index) => {
    const failed = faker.number.float({ min: 0, max: 1, fractionDigits: 2 }) <= options.notificationFailureRate;
    return {
      id: faker.string.uuid(),
      userId,
      periodId: sentPeriod.id,
      channel: NotificationChannel.Email,
      status: failed ? NotificationStatus.Failed : NotificationStatus.Sent,
      error: failed ? faker.helpers.arrayElement(['Transient SMTP timeout', 'Mailbox full', 'Suppressed by provider']) : null,
      sentAt: failed ? null : addDays(-1, 18, 5 + index),
    };
  });

  const auditLog: SeedAuditRecord[] = [
    {
      id: faker.string.uuid(),
      actorId: adminUser.id,
      action: 'seed_dataset_generated',
      targetType: 'seed_profile',
      targetId: options.profile,
      payload: {
        seed: options.seed,
        users: users.length,
        periods: periods.length,
        exams: exams.length,
      },
      createdAt: addDays(-2),
    },
    {
      id: faker.string.uuid(),
      actorId: adminUser.id,
      action: 'seed_open_period_created',
      targetType: 'exam_period',
      targetId: openPeriod.id,
      payload: { status: openPeriod.status, exams: options.openExamCount },
      createdAt: openPeriod.createdAt,
    },
    {
      id: faker.string.uuid(),
      actorId: proctors[0]?.id ?? null,
      action: 'submit_availability',
      targetType: 'exam_period',
      targetId: openPeriod.id,
      payload: { responses: openPeriodExams.length },
      createdAt: availabilitySubmissions[0]?.submittedAt ?? addDays(-1),
    },
    {
      id: faker.string.uuid(),
      actorId: allStaff[0]?.id ?? adminUser.id,
      action: 'run_scheduler',
      targetType: 'exam_period',
      targetId: scheduledPeriod.id,
      payload: { assignments: assignments.length, manualOverrides: assignments.filter((item) => item.manualOverride).length },
      createdAt: addDays(-1, 14, 30),
    },
    {
      id: faker.string.uuid(),
      actorId: adminUser.id,
      action: 'send_schedules',
      targetType: 'exam_period',
      targetId: sentPeriod.id,
      payload: { notifications: notificationLog.length },
      createdAt: addDays(-1, 18, 0),
    },
  ];

  const loginHints: SeedLoginHint[] = [
    { label: 'Admin', nationalId: '000000018', password: 'Admin1!23' },
    { label: 'Exam Staff', nationalId: '000000026', password: 'Staff1!23' },
    {
      label: 'Proctor',
      nationalId: '000000034',
      password: '123456',
      note: 'Must change password on first login.',
    },
    { label: 'Generated accounts', nationalId: generatedProctors[0]?.nationalId ?? 'n/a', password: options.generatedPassword, note: 'All generated staff/proctors share this password.' },
  ];

  return {
    options,
    generatedAt,
    users,
    periods,
    exams,
    availabilitySubmissions,
    availabilities,
    assignments,
    notificationLog,
    auditLog,
    loginHints,
  };
}

interface BuildGeneratedUserParams {
  faker: Faker;
  role: UserRole;
  proctorType: ProctorType | null;
  nationalIdSequence: number;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  mustChangePassword?: boolean;
}

/**
 * Builds a single deterministic mock user.
 */
function buildGeneratedUser(params: BuildGeneratedUserParams): SeedUserRecord {
  const firstName = params.faker.person.firstName();
  const lastName = params.faker.person.lastName();
  const email = `${firstName}.${lastName}.${params.nationalIdSequence}@example.test`
    .toLowerCase()
    .replace(/[^a-z0-9.@_-]/g, '');

  return {
    id: params.faker.string.uuid(),
    nationalId: String(100000000 + params.nationalIdSequence).padStart(9, '0'),
    firstName,
    lastName,
    phone: params.faker.number.int({ min: 0, max: 1 }) === 0 ? null : `05${params.faker.string.numeric(8)}`,
    email,
    password: params.password,
    role: params.role,
    proctorType: params.proctorType,
    mustChangePassword: params.mustChangePassword ?? false,
    active: true,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
  };
}

interface BuildPeriodExamsParams {
  faker: Faker;
  periodId: string;
  count: number;
  dayOffset: number;
  dateOnly: (days: number) => string;
}

/**
 * Creates deterministic exams for a specific period.
 */
function buildPeriodExams(params: BuildPeriodExamsParams): SeedExamRecord[] {
  return Array.from({ length: params.count }, (_, index) => {
    const timeSlot = EXAM_TIME_SLOTS[index % EXAM_TIME_SLOTS.length]!;
    return {
      id: params.faker.string.uuid(),
      periodId: params.periodId,
      examDate: params.dateOnly(params.dayOffset + index * 2),
      startTime: timeSlot.startTime,
      endTime: timeSlot.endTime,
      classroomCount: params.faker.number.int({ min: 1, max: 4 }),
      category: EXAM_CATEGORIES[index % EXAM_CATEGORIES.length]!,
    };
  });
}

