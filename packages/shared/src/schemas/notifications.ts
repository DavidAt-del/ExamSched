import { z } from 'zod';

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
