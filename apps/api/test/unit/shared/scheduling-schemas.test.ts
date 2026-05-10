import { describe, it, expect } from 'vitest';
import {
  ManualOverrideRequestSchema,
  AssignmentDtoSchema,
  ScheduleResultDtoSchema,
} from '@app/shared';

describe('scheduling schemas', () => {
  describe('ManualOverrideRequestSchema', () => {
    it('accepts a valid override with no regular and no notes', () => {
      const r = ManualOverrideRequestSchema.safeParse({
        openerUserId: '00000000-0000-0000-0000-000000000001',
        regularUserId: null,
        notes: null,
      });
      expect(r.success).toBe(true);
    });

    it('rejects extra properties (strict — no manualOverride flag from clients)', () => {
      const r = ManualOverrideRequestSchema.safeParse({
        openerUserId: '00000000-0000-0000-0000-000000000001',
        regularUserId: null,
        notes: null,
        manualOverride: true,
      });
      expect(r.success).toBe(false);
    });

    it('rejects non-uuid opener', () => {
      const r = ManualOverrideRequestSchema.safeParse({
        openerUserId: 'not-a-uuid',
        regularUserId: null,
        notes: null,
      });
      expect(r.success).toBe(false);
    });
  });

  describe('AssignmentDtoSchema', () => {
    it('regular may be null', () => {
      const r = AssignmentDtoSchema.safeParse({
        id: '11111111-1111-1111-1111-111111111111',
        examId: '22222222-2222-2222-2222-222222222222',
        classroomIndex: 0,
        opener: { id: '33333333-3333-3333-3333-333333333333', firstName: 'D', lastName: 'C' },
        regular: null,
        manualOverride: false,
        notes: null,
      });
      expect(r.success).toBe(true);
    });
  });

  describe('ScheduleResultDtoSchema', () => {
    it('accepts an empty result (no openers, all classrooms unfilled)', () => {
      const r = ScheduleResultDtoSchema.safeParse({
        assignments: [],
        unfilledClassrooms: [
          { examId: '22222222-2222-2222-2222-222222222222', index: 0 },
          { examId: '22222222-2222-2222-2222-222222222222', index: 1 },
        ],
      });
      expect(r.success).toBe(true);
    });
  });
});
