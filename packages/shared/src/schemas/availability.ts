import { z } from 'zod';

export const SubmitAvailabilityRequestSchema = z.object({
  examId: z.string().uuid(),
  available: z.boolean(),
});
export type SubmitAvailabilityRequest = z.infer<typeof SubmitAvailabilityRequestSchema>;

export const AvailabilityDtoSchema = z.object({
  id: z.string().uuid(),
  examId: z.string().uuid(),
  userId: z.string().uuid(),
  available: z.boolean(),
  submittedAt: z.string().datetime(),
});
export type AvailabilityDto = z.infer<typeof AvailabilityDtoSchema>;

// Per-exam summary for a single proctor. Used inside the period-grouped
// MyPeriodsResponse (see schemas/proctor.ts).
export const ExamSummaryDtoSchema = z.object({
  id: z.string().uuid(),
  periodId: z.string().uuid(),
  examDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  classroomCount: z.number().int().positive(),
  myAvailability: z.boolean().nullable(),
});
export type ExamSummaryDto = z.infer<typeof ExamSummaryDtoSchema>;
