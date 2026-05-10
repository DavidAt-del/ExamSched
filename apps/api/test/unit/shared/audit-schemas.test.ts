import { describe, it, expect } from 'vitest';
import {
  AuditLogQueryRequestSchema,
  AuditLogPageResponseSchema,
} from '@app/shared';

describe('audit schemas', () => {
  describe('AuditLogQueryRequestSchema', () => {
    it('accepts an empty object (all defaults applied server-side)', () => {
      expect(AuditLogQueryRequestSchema.safeParse({}).success).toBe(true);
    });

    it('coerces page/limit from query string strings', () => {
      const r = AuditLogQueryRequestSchema.safeParse({ page: '3', limit: '25' });
      expect(r.success).toBe(true);
      if (r.success) {
        expect(r.data.page).toBe(3);
        expect(r.data.limit).toBe(25);
      }
    });

    it('rejects extra properties (.strict)', () => {
      const r = AuditLogQueryRequestSchema.safeParse({ actor: 'x' });
      expect(r.success).toBe(false);
    });

    it('caps limit at 200', () => {
      expect(AuditLogQueryRequestSchema.safeParse({ limit: 201 }).success).toBe(false);
    });

    it('requires ISO datetime with offset for from/to', () => {
      expect(
        AuditLogQueryRequestSchema.safeParse({ from: '2026-01-01' }).success,
      ).toBe(false);
      expect(
        AuditLogQueryRequestSchema.safeParse({ from: '2026-01-01T00:00:00.000Z' }).success,
      ).toBe(true);
    });
  });

  describe('AuditLogPageResponseSchema', () => {
    it('validates a small page', () => {
      const r = AuditLogPageResponseSchema.safeParse({
        page: 1,
        limit: 50,
        total: 1,
        items: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            actorId: null,
            actorName: null,
            action: 'scheduler.run',
            targetType: 'exam_period',
            targetId: '22222222-2222-2222-2222-222222222222',
            payload: { exams: 1 },
            createdAt: '2026-05-10T10:00:00.000Z',
          },
        ],
      });
      expect(r.success).toBe(true);
    });
  });
});
