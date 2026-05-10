import { z } from 'zod';
import { ExamPeriodStatus, ProctorType } from '../domain-enums/index.js';
import { NationalIdSchema } from './auth.js';

const ProctorTypeSchema = z.enum([ProctorType.Opener, ProctorType.Regular]);
const ExamPeriodStatusSchema = z.enum([
  ExamPeriodStatus.Open,
  ExamPeriodStatus.Closed,
  ExamPeriodStatus.Scheduled,
  ExamPeriodStatus.Sent,
]);

// HH:MM 24-hour time. Backend persists as time(0); the wire format omits seconds.
const TimeOfDaySchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/u, { message: 'must_be_HH_MM' });

// YYYY-MM-DD calendar date.
const CalendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, { message: 'must_be_YYYY_MM_DD' });

// ── Proctor CRUD ──────────────────────────────────────────────────────────

export const CreateProctorRequestSchema = z
  .object({
    nationalId: NationalIdSchema,
    firstName: z.string().trim().min(1).max(120),
    lastName: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(9).max(20).nullable().optional(),
    email: z.string().email().nullable().optional(),
    proctorType: ProctorTypeSchema,
  })
  .strict();
export type CreateProctorRequest = z.infer<typeof CreateProctorRequestSchema>;

export const UpdateProctorRequestSchema = z
  .object({
    firstName: z.string().trim().min(1).max(120).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    phone: z.string().trim().min(9).max(20).nullable().optional(),
    email: z.string().email().nullable().optional(),
    proctorType: ProctorTypeSchema.optional(),
  })
  .strict();
export type UpdateProctorRequest = z.infer<typeof UpdateProctorRequestSchema>;

export const ProctorListItemSchema = z.object({
  id: z.string().uuid(),
  nationalId: NationalIdSchema,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  email: z.string().email().nullable(),
  proctorType: ProctorTypeSchema,
  active: z.boolean(),
});
export type ProctorListItem = z.infer<typeof ProctorListItemSchema>;

export const ProctorListResponseSchema = z.object({
  proctors: z.array(ProctorListItemSchema),
});
export type ProctorListResponse = z.infer<typeof ProctorListResponseSchema>;

// ── Exam Period CRUD ──────────────────────────────────────────────────────

export const CreateExamPeriodRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    deadline: z.string().datetime({ offset: true }),
  })
  .strict();
export type CreateExamPeriodRequest = z.infer<typeof CreateExamPeriodRequestSchema>;

export const ExamPeriodDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  deadline: z.string().datetime({ offset: true }),
  status: ExamPeriodStatusSchema,
  createdAt: z.string().datetime({ offset: true }),
});
export type ExamPeriodDto = z.infer<typeof ExamPeriodDtoSchema>;

export const ExamPeriodListResponseSchema = z.object({
  periods: z.array(ExamPeriodDtoSchema),
});
export type ExamPeriodListResponse = z.infer<typeof ExamPeriodListResponseSchema>;

// ── Exam CRUD (within a period) ───────────────────────────────────────────

export const CreateExamRequestSchema = z
  .object({
    examDate: CalendarDateSchema,
    startTime: TimeOfDaySchema,
    endTime: TimeOfDaySchema,
    classroomCount: z.number().int().positive().max(200),
  })
  .strict()
  .refine((v) => v.startTime < v.endTime, {
    message: 'start_time_must_be_before_end_time',
    path: ['endTime'],
  });
export type CreateExamRequest = z.infer<typeof CreateExamRequestSchema>;

export const ExamDtoSchema = z.object({
  id: z.string().uuid(),
  periodId: z.string().uuid(),
  examDate: CalendarDateSchema,
  startTime: TimeOfDaySchema,
  endTime: TimeOfDaySchema,
  classroomCount: z.number().int().positive(),
});
export type ExamDto = z.infer<typeof ExamDtoSchema>;

export const ExamListResponseSchema = z.object({
  exams: z.array(ExamDtoSchema),
});
export type ExamListResponse = z.infer<typeof ExamListResponseSchema>;

// ── Staff users (exam_staff role) ─────────────────────────────────────────

export const StaffUserDtoSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().nullable(),
  active: z.boolean(),
});
export type StaffUserDto = z.infer<typeof StaffUserDtoSchema>;

export const StaffUserListResponseSchema = z.object({
  users: z.array(StaffUserDtoSchema),
});
export type StaffUserListResponse = z.infer<typeof StaffUserListResponseSchema>;

// ── Password reset ────────────────────────────────────────────────────────

export const ResetPasswordResponseSchema = z.object({
  temporaryPassword: z.string(),
});
export type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

// ── Bulk import result ────────────────────────────────────────────────────

export const ImportProctorsResultSchema = z.object({
  created: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  errors: z.array(z.string()),
});
export type ImportProctorsResult = z.infer<typeof ImportProctorsResultSchema>;
