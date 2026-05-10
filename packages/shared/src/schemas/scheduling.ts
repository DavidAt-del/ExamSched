import { z } from 'zod';
import { ExamDtoSchema, ExamPeriodDtoSchema } from './admin.js';

// Run scheduler — body is empty; periodId comes from the URL path.
export const RunSchedulerRequestSchema = z.object({}).strict();
export type RunSchedulerRequest = z.infer<typeof RunSchedulerRequestSchema>;

export const ProctorRefSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
});
export type ProctorRef = z.infer<typeof ProctorRefSchema>;

export const AssignmentDtoSchema = z.object({
  id: z.string().uuid(),
  examId: z.string().uuid(),
  classroomIndex: z.number().int().nonnegative(),
  opener: ProctorRefSchema,
  regular: ProctorRefSchema.nullable(),
  manualOverride: z.boolean(),
  notes: z.string().nullable(),
});
export type AssignmentDto = z.infer<typeof AssignmentDtoSchema>;

export const UnfilledClassroomSchema = z.object({
  examId: z.string().uuid(),
  index: z.number().int().nonnegative(),
});
export type UnfilledClassroom = z.infer<typeof UnfilledClassroomSchema>;

export const ScheduleResultDtoSchema = z.object({
  assignments: z.array(AssignmentDtoSchema),
  unfilledClassrooms: z.array(UnfilledClassroomSchema),
});
export type ScheduleResultDto = z.infer<typeof ScheduleResultDtoSchema>;

export const ManualOverrideRequestSchema = z
  .object({
    openerUserId: z.string().uuid(),
    regularUserId: z.string().uuid().nullable(),
    notes: z.string().max(500).nullable(),
  })
  .strict();
export type ManualOverrideRequest = z.infer<typeof ManualOverrideRequestSchema>;

export const ScheduleViewExamDtoSchema = ExamDtoSchema.extend({
  assignments: z.array(AssignmentDtoSchema),
});
export type ScheduleViewExamDto = z.infer<typeof ScheduleViewExamDtoSchema>;

export const ScheduleViewResponseSchema = z.object({
  // Period meta surfaced so the schedule UI can gate the Send button on
  // status === 'scheduled' and show a "sent" badge once dispatched.
  period: ExamPeriodDtoSchema,
  exams: z.array(ScheduleViewExamDtoSchema),
});
export type ScheduleViewResponse = z.infer<typeof ScheduleViewResponseSchema>;
