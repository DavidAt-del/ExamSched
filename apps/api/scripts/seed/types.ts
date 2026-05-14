import type {
  ExamCategory,
  ExamPeriodStatus,
  NotificationChannel,
  NotificationStatus,
  ProctorType,
  UserRole,
} from '@app/shared';

/**
 * Supported seeding profiles.
 *
 * - `demo` keeps the small curated dataset that is ideal for product demos.
 * - `mocker` scales the dataset with deterministic fake data for richer QA flows.
 * - `load` creates a heavier but still laptop-friendly local dataset.
 */
export type SeedProfile = 'demo' | 'mocker' | 'load';

/**
 * Tunable knobs for deterministic dataset generation.
 */
export interface SeedGenerationOptions {
  /** Named preset to start from before CLI overrides are applied. */
  profile: SeedProfile;
  /** Seed passed into Faker so repeated runs create the same rows. */
  seed: number;
  /** Shared password for generated staff and proctor users. */
  generatedPassword: string;
  /** Additional exam-staff users beyond the curated default operator. */
  extraStaffCount: number;
  /** Additional proctors to generate with the mock-data factory. */
  extraProctorCount: number;
  /** Exam count for the open period. */
  openExamCount: number;
  /** Exam count for the scheduled period. */
  scheduledExamCount: number;
  /** Exam count for the sent period. */
  sentExamCount: number;
  /** Exam count for the closed period. */
  closedExamCount: number;
  /** Availability probability for generated proctors in the open period. */
  availabilityPositiveRate: number;
  /** Notification failure probability for sent-period records. */
  notificationFailureRate: number;
  /** Probability that an assignment is flagged as a manual override. */
  manualOverrideRate: number;
}

/**
 * User row destined for the `users` table.
 */
export interface SeedUserRecord {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  password: string;
  role: UserRole;
  proctorType: ProctorType | null;
  mustChangePassword: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Exam-period row destined for the `exam_periods` table.
 */
export interface SeedPeriodRecord {
  id: string;
  name: string;
  deadline: Date;
  status: ExamPeriodStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Exam row destined for the `exams` table.
 */
export interface SeedExamRecord {
  id: string;
  periodId: string;
  examDate: string;
  startTime: string;
  endTime: string;
  classroomCount: number;
  category: ExamCategory;
}

/**
 * Availability-submission row for a single proctor in a specific period.
 */
export interface SeedAvailabilitySubmissionRecord {
  id: string;
  userId: string;
  periodId: string;
  submittedAt: Date;
}

/**
 * Availability answer row for a single exam.
 */
export interface SeedAvailabilityRecord {
  id: string;
  userId: string;
  examId: string;
  available: boolean;
  submittedAt: Date;
}

/**
 * Assignment row for the scheduler results view.
 */
export interface SeedAssignmentRecord {
  id: string;
  examId: string;
  classroomIndex: number;
  openerUserId: string;
  regularUserId: string | null;
  manualOverride: boolean;
  notes: string | null;
}

/**
 * Notification-log row emitted after schedule delivery.
 */
export interface SeedNotificationRecord {
  id: string;
  userId: string;
  periodId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  error: string | null;
  sentAt: Date | null;
}

/**
 * Audit-log row that helps exercise the admin audit screen.
 */
export interface SeedAuditRecord {
  id: string;
  actorId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: Date;
}

/**
 * Login hint printed after a successful seed run.
 */
export interface SeedLoginHint {
  label: string;
  nationalId: string;
  password: string;
  note?: string;
}

/**
 * Fully materialized dataset used by the SQL seeding step.
 */
export interface SeedDataset {
  options: SeedGenerationOptions;
  generatedAt: Date;
  users: SeedUserRecord[];
  periods: SeedPeriodRecord[];
  exams: SeedExamRecord[];
  availabilitySubmissions: SeedAvailabilitySubmissionRecord[];
  availabilities: SeedAvailabilityRecord[];
  assignments: SeedAssignmentRecord[];
  notificationLog: SeedNotificationRecord[];
  auditLog: SeedAuditRecord[];
  loginHints: SeedLoginHint[];
}

