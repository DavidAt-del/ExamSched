import { z } from 'zod';
import { ExamPeriodStatus } from '../domain-enums/index.js';
import { ExamSummaryDtoSchema } from './availability.js';
import { ProctorRefSchema } from './scheduling.js';

const ExamPeriodStatusSchema = z.enum([
  ExamPeriodStatus.Open,
  ExamPeriodStatus.Closed,
  ExamPeriodStatus.Scheduled,
  ExamPeriodStatus.Sent,
]);

// ── /api/proctor/my-periods ───────────────────────────────────────────────
// Period-grouped view that the proctor home page renders. Each period
// carries its lifecycle bits (status + deadline) plus a `submitted` flag so
// the UI can swap from "marking" mode to a thank-you message.

export const MyPeriodDtoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  status: ExamPeriodStatusSchema,
  deadline: z.string().datetime({ offset: true }),
  submitted: z.boolean(),
  exams: z.array(ExamSummaryDtoSchema),
});
export type MyPeriodDto = z.infer<typeof MyPeriodDtoSchema>;

export const MyPeriodsResponseSchema = z.object({
  periods: z.array(MyPeriodDtoSchema),
});
export type MyPeriodsResponse = z.infer<typeof MyPeriodsResponseSchema>;

// ── /api/proctor/my-schedule ──────────────────────────────────────────────
// Read-only view shown after staff send the schedule. Flat list (one row per
// classroom this proctor is assigned to) so the calendar can render it
// without further joining.

export const MyAssignmentDtoSchema = z.object({
  examId: z.string().uuid(),
  examDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  classroomIndex: z.number().int().nonnegative(),
  role: z.enum(['opener', 'regular']),
  partner: ProctorRefSchema.nullable(),
  notes: z.string().nullable(),
  period: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
});
export type MyAssignmentDto = z.infer<typeof MyAssignmentDtoSchema>;

export const MyScheduleResponseSchema = z.object({
  assignments: z.array(MyAssignmentDtoSchema),
});
export type MyScheduleResponse = z.infer<typeof MyScheduleResponseSchema>;

// ── /api/availability/finalize/:periodId ──────────────────────────────────
// No body; periodId in the path. Response carries the timestamp so the UI
// can display "submitted at HH:MM" if desired.

export const FinalizeAvailabilityResponseSchema = z.object({
  periodId: z.string().uuid(),
  submittedAt: z.string().datetime({ offset: true }),
});
export type FinalizeAvailabilityResponse = z.infer<
  typeof FinalizeAvailabilityResponseSchema
>;
