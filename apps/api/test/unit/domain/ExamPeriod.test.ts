import { describe, it, expect } from 'vitest';
import { ExamPeriodStatus } from '@app/shared';
import { ExamPeriod } from '../../../src/domain/entities/ExamPeriod.js';
import { InvariantViolationError } from '../../../src/domain/errors/DomainError.js';

const now = new Date('2026-05-12T10:00:00Z');
const later = new Date('2026-05-13T10:00:00Z');
const deadline = new Date('2026-09-01T00:00:00Z');

function mkPeriod(status: ExamPeriodStatus): ExamPeriod {
  return new ExamPeriod({
    id: 'p1',
    name: 'Test Period',
    deadline,
    status,
    createdBy: 'admin',
    createdAt: now,
    updatedAt: now,
  });
}

describe('ExamPeriod state machine', () => {
  // ── close() ────────────────────────────────────────────────────────────────

  describe('close()', () => {
    it('transitions Open → Closed', () => {
      const p = mkPeriod(ExamPeriodStatus.Open);
      p.close(later);
      expect(p.status).toBe(ExamPeriodStatus.Closed);
      expect(p.updatedAt).toBe(later);
    });

    it('is idempotent when already Closed', () => {
      const p = mkPeriod(ExamPeriodStatus.Closed);
      p.close(later); // should not throw
      expect(p.status).toBe(ExamPeriodStatus.Closed);
    });

    it('throws when period is Scheduled', () => {
      const p = mkPeriod(ExamPeriodStatus.Scheduled);
      expect(() => p.close(later)).toThrow(InvariantViolationError);
    });

    it('throws when period is Sent', () => {
      const p = mkPeriod(ExamPeriodStatus.Sent);
      expect(() => p.close(later)).toThrow(InvariantViolationError);
    });
  });

  // ── markScheduled() ────────────────────────────────────────────────────────

  describe('markScheduled()', () => {
    it('transitions Open → Scheduled', () => {
      const p = mkPeriod(ExamPeriodStatus.Open);
      p.markScheduled(later);
      expect(p.status).toBe(ExamPeriodStatus.Scheduled);
      expect(p.updatedAt).toBe(later);
    });

    it('transitions Closed → Scheduled', () => {
      const p = mkPeriod(ExamPeriodStatus.Closed);
      p.markScheduled(later);
      expect(p.status).toBe(ExamPeriodStatus.Scheduled);
    });

    it('re-runs allowed: Scheduled → Scheduled', () => {
      const p = mkPeriod(ExamPeriodStatus.Scheduled);
      p.markScheduled(later);
      expect(p.status).toBe(ExamPeriodStatus.Scheduled);
    });

    it('throws when period is Sent', () => {
      const p = mkPeriod(ExamPeriodStatus.Sent);
      expect(() => p.markScheduled(later)).toThrow(InvariantViolationError);
    });
  });

  // ── markSent() ─────────────────────────────────────────────────────────────

  describe('markSent()', () => {
    it('transitions Scheduled → Sent', () => {
      const p = mkPeriod(ExamPeriodStatus.Scheduled);
      p.markSent(later);
      expect(p.status).toBe(ExamPeriodStatus.Sent);
      expect(p.updatedAt).toBe(later);
    });

    it('throws when period is Open', () => {
      const p = mkPeriod(ExamPeriodStatus.Open);
      expect(() => p.markSent(later)).toThrow(InvariantViolationError);
    });

    it('throws when period is Closed', () => {
      const p = mkPeriod(ExamPeriodStatus.Closed);
      expect(() => p.markSent(later)).toThrow(InvariantViolationError);
    });

    it('throws when period is already Sent', () => {
      const p = mkPeriod(ExamPeriodStatus.Sent);
      expect(() => p.markSent(later)).toThrow(InvariantViolationError);
    });
  });
});

