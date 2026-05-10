import { z } from 'zod';

// Query-string filter for /api/admin/audit-log. All fields optional;
// `page` defaults to 1, `limit` to 50 server-side.
export const AuditLogQueryRequestSchema = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    from: z.string().datetime({ offset: true }).optional(),
    to: z.string().datetime({ offset: true }).optional(),
  })
  .strict();
export type AuditLogQueryRequest = z.infer<typeof AuditLogQueryRequestSchema>;

export const AuditLogEntryDtoSchema = z.object({
  id: z.string().uuid(),
  actorId: z.string().uuid().nullable(),
  /** Pre-joined "first last" name; null when the actor row is missing. */
  actorName: z.string().nullable(),
  action: z.string(),
  targetType: z.string().nullable(),
  targetId: z.string().nullable(),
  payload: z.record(z.unknown()).nullable(),
  createdAt: z.string().datetime({ offset: true }),
});
export type AuditLogEntryDto = z.infer<typeof AuditLogEntryDtoSchema>;

export const AuditLogPageResponseSchema = z.object({
  items: z.array(AuditLogEntryDtoSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
});
export type AuditLogPageResponse = z.infer<typeof AuditLogPageResponseSchema>;
