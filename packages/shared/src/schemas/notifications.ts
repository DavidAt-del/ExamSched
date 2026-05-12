import { z } from 'zod';
import { NotificationChannel, NotificationStatus } from '../domain-enums/index.js';

export const SendSchedulesRequestSchema = z
  .object({
    /**
     * Optional whitelist of proctor user ids. Empty array or omitted means
     * "send to every assigned proctor for the period".
     */
    userIds: z.array(z.string().uuid()).optional(),
  })
  .strict();
export type SendSchedulesRequest = z.infer<typeof SendSchedulesRequestSchema>;

export const SendSchedulesResponseSchema = z.object({
  sent: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
});
export type SendSchedulesResponse = z.infer<typeof SendSchedulesResponseSchema>;

export const NotificationLogEntryDtoSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  periodId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  nationalId: z.string(),
  channel: z.enum([NotificationChannel.Email, NotificationChannel.Sms]),
  status: z.enum([
    NotificationStatus.Pending,
    NotificationStatus.Sent,
    NotificationStatus.Failed,
  ]),
  error: z.string().nullable(),
  sentAt: z.string().datetime({ offset: true }).nullable(),
});
export type NotificationLogEntryDto = z.infer<typeof NotificationLogEntryDtoSchema>;

export const NotificationLogResponseSchema = z.object({
  entries: z.array(NotificationLogEntryDtoSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
});
export type NotificationLogResponse = z.infer<typeof NotificationLogResponseSchema>;
