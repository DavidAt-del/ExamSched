import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamPeriodStatus } from '@app/shared';
import { FinalizeAvailabilityUseCase } from '../../../../src/application/use-cases/availability/FinalizeAvailabilityUseCase.js';
import { ExamPeriod } from '../../../../src/domain/entities/ExamPeriod.js';
import { AvailabilitySubmission } from '../../../../src/domain/entities/AvailabilitySubmission.js';
import {
  NotFoundError,
  PeriodLockedError,
} from '../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');

function mkPeriod(opts: {
  status?: ExamPeriodStatus;
  deadline?: Date;
} = {}): ExamPeriod {
  return new ExamPeriod({
    id: 'p1',
    name: 'Summer',
    deadline: opts.deadline ?? new Date('2026-09-01T00:00:00Z'),
    status: opts.status ?? ExamPeriodStatus.Open,
    createdBy: 'admin',
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

describe('FinalizeAvailabilityUseCase', () => {
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let submissions: { find: ReturnType<typeof vi.fn>; findByUser: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let audit: { log: ReturnType<typeof vi.fn> };
  let useCase: FinalizeAvailabilityUseCase;
  const ids = { next: vi.fn(() => 'submission-1') };
  const clock = { now: () => fixedNow };

  beforeEach(() => {
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    submissions = { find: vi.fn(), findByUser: vi.fn(), save: vi.fn() };
    audit = { log: vi.fn() };
    useCase = new FinalizeAvailabilityUseCase(periods, submissions, clock, ids, audit);
  });

  it('rejects unknown period with NotFound', async () => {
    periods.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ userId: 'u1', periodId: 'p1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects when period is closed', async () => {
    periods.findById.mockResolvedValue(mkPeriod({ status: ExamPeriodStatus.Closed }));
    await expect(
      useCase.execute({ userId: 'u1', periodId: 'p1' }),
    ).rejects.toBeInstanceOf(PeriodLockedError);
    expect(submissions.save).not.toHaveBeenCalled();
  });

  it('rejects when period is scheduled', async () => {
    periods.findById.mockResolvedValue(mkPeriod({ status: ExamPeriodStatus.Scheduled }));
    await expect(
      useCase.execute({ userId: 'u1', periodId: 'p1' }),
    ).rejects.toBeInstanceOf(PeriodLockedError);
  });

  it('rejects when deadline has passed', async () => {
    periods.findById.mockResolvedValue(
      mkPeriod({ deadline: new Date(fixedNow.getTime() - 1000) }),
    );
    await expect(
      useCase.execute({ userId: 'u1', periodId: 'p1' }),
    ).rejects.toBeInstanceOf(PeriodLockedError);
  });

  it('returns existing submission idempotently without re-auditing', async () => {
    periods.findById.mockResolvedValue(mkPeriod());
    const existing = new AvailabilitySubmission({
      id: 'existing-id',
      userId: 'u1',
      periodId: 'p1',
      submittedAt: new Date('2026-05-09T10:00:00Z'),
    });
    submissions.find.mockResolvedValue(existing);

    const result = await useCase.execute({ userId: 'u1', periodId: 'p1' });

    expect(result).toBe(existing);
    expect(submissions.save).not.toHaveBeenCalled();
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('creates a new submission with the current timestamp and audits', async () => {
    periods.findById.mockResolvedValue(mkPeriod());
    submissions.find.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'u1', periodId: 'p1' });

    expect(result.userId).toBe('u1');
    expect(result.periodId).toBe('p1');
    expect(result.submittedAt).toEqual(fixedNow);
    expect(submissions.save).toHaveBeenCalledWith(result);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'u1',
        action: 'availability.finalized',
        targetType: 'exam_period',
      }),
    );
  });
});
