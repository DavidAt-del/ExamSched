import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamPeriodStatus, ProctorType, UserRole } from '@app/shared';
import { RunSchedulerUseCase } from '../../../../src/application/use-cases/scheduling/RunSchedulerUseCase.js';
import { GreedySchedulingEngine } from '../../../../src/infrastructure/scheduler/GreedySchedulingEngine.js';
import { Exam } from '../../../../src/domain/entities/Exam.js';
import { ExamPeriod } from '../../../../src/domain/entities/ExamPeriod.js';
import { Availability } from '../../../../src/domain/entities/Availability.js';
import { User } from '../../../../src/domain/entities/User.js';
import { NationalId } from '../../../../src/domain/value-objects/NationalId.js';
import { InvariantViolationError, NotFoundError } from '../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');
const validNationalIds = [
  '000000018',
  '000000026',
  '000000034',
  '000000042',
  '000000059',
];

function mkPeriod(status: ExamPeriodStatus = ExamPeriodStatus.Open): ExamPeriod {
  return new ExamPeriod({
    id: 'p1',
    name: 'Summer',
    deadline: new Date('2026-09-01T00:00:00Z'),
    status,
    createdBy: 'admin',
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

function mkExam(id = 'e1', classroomCount = 2): Exam {
  return new Exam({
    id,
    periodId: 'p1',
    examDate: '2026-06-15',
    startTime: '09:00:00',
    endTime: '12:00:00',
    classroomCount,
  });
}

function mkUser(
  id: string,
  type: ProctorType,
  active = true,
  idx = 0,
): User {
  return new User({
    id,
    nationalId: NationalId.create(validNationalIds[idx % validNationalIds.length]!),
    firstName: 'F',
    lastName: id,
    email: null,
    phone: null,
    passwordHash: 'h',
    role: UserRole.Proctor,
    proctorType: type,
    mustChangePassword: false,
    active,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

function mkAvailability(userId: string, examId: string, available: boolean): Availability {
  return new Availability({
    id: `a-${userId}-${examId}`,
    userId,
    examId,
    available,
    submittedAt: fixedNow,
  });
}

describe('RunSchedulerUseCase', () => {
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let exams: { findById: ReturnType<typeof vi.fn>; findOpenForProctor: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let users: { findById: ReturnType<typeof vi.fn>; findByNationalId: ReturnType<typeof vi.fn>; findAllProctors: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn> };
  let availability: { findByUserAndExam: ReturnType<typeof vi.fn>; findByUser: ReturnType<typeof vi.fn>; findByExam: ReturnType<typeof vi.fn>; countAvailableForExam: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let assignments: { findByExam: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; findByUser: ReturnType<typeof vi.fn>; hasFutureForUser: ReturnType<typeof vi.fn>; replaceForExam: ReturnType<typeof vi.fn>; replaceForPeriod: ReturnType<typeof vi.fn>; findByExamAndClassroom: ReturnType<typeof vi.fn>; saveOne: ReturnType<typeof vi.fn> };
  let audit: { log: ReturnType<typeof vi.fn> };
  let useCase: RunSchedulerUseCase;
  const ids = (() => {
    let n = 0;
    return { next: vi.fn(() => `assignment-${++n}`) };
  })();

  beforeEach(() => {
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    exams = { findById: vi.fn(), findOpenForProctor: vi.fn(), findByPeriod: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    users = { findById: vi.fn(), findByNationalId: vi.fn(), findAllProctors: vi.fn(), save: vi.fn(), deactivate: vi.fn() };
    availability = { findByUserAndExam: vi.fn(), findByUser: vi.fn(), findByExam: vi.fn(), countAvailableForExam: vi.fn(), save: vi.fn() };
    assignments = { findByExam: vi.fn(), findByPeriod: vi.fn(), findByUser: vi.fn(), hasFutureForUser: vi.fn(), replaceForExam: vi.fn(), replaceForPeriod: vi.fn(), findByExamAndClassroom: vi.fn(), saveOne: vi.fn() };
    audit = { log: vi.fn() };
    useCase = new RunSchedulerUseCase(
      periods,
      exams,
      users,
      availability,
      assignments,
      new GreedySchedulingEngine(),
      { now: () => fixedNow },
      ids,
      audit,
    );
  });

  it('rejects unknown period with NotFound', async () => {
    periods.findById.mockResolvedValue(null);
    await expect(useCase.execute({ periodId: 'p1', actorId: 'admin' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('rejects scheduling a period that has already been sent', async () => {
    periods.findById.mockResolvedValue(mkPeriod(ExamPeriodStatus.Sent));
    await expect(useCase.execute({ periodId: 'p1', actorId: 'admin' })).rejects.toBeInstanceOf(
      InvariantViolationError,
    );
  });

  it('with zero proctors available leaves every classroom unfilled', async () => {
    periods.findById.mockResolvedValue(mkPeriod());
    exams.findByPeriod.mockResolvedValue([mkExam('e1', 3)]);
    users.findAllProctors.mockResolvedValue([]);
    availability.findByExam.mockResolvedValue([]);

    const out = await useCase.execute({ periodId: 'p1', actorId: 'admin' });

    expect(out.assignments).toHaveLength(0);
    expect(out.unfilledClassrooms).toEqual([
      { examId: 'e1', index: 0 },
      { examId: 'e1', index: 1 },
      { examId: 'e1', index: 2 },
    ]);
    expect(assignments.replaceForPeriod).toHaveBeenCalledWith('p1', []);
  });

  it('with all-regular pool leaves every classroom unfilled (no openerless rooms)', async () => {
    const r1 = mkUser('u1', ProctorType.Regular, true, 0);
    const r2 = mkUser('u2', ProctorType.Regular, true, 1);
    periods.findById.mockResolvedValue(mkPeriod());
    exams.findByPeriod.mockResolvedValue([mkExam('e1', 2)]);
    users.findAllProctors.mockResolvedValue([r1, r2]);
    availability.findByExam.mockResolvedValue([
      mkAvailability('u1', 'e1', true),
      mkAvailability('u2', 'e1', true),
    ]);

    const out = await useCase.execute({ periodId: 'p1', actorId: 'admin' });

    expect(out.assignments).toHaveLength(0);
    expect(out.unfilledClassrooms).toHaveLength(2);
  });

  it('with more classrooms than available openers fills what it can', async () => {
    const o1 = mkUser('u1', ProctorType.Opener, true, 0);
    const r1 = mkUser('u2', ProctorType.Regular, true, 1);
    periods.findById.mockResolvedValue(mkPeriod());
    exams.findByPeriod.mockResolvedValue([mkExam('e1', 3)]);
    users.findAllProctors.mockResolvedValue([o1, r1]);
    availability.findByExam.mockResolvedValue([
      mkAvailability('u1', 'e1', true),
      mkAvailability('u2', 'e1', true),
    ]);

    const out = await useCase.execute({ periodId: 'p1', actorId: 'admin' });

    expect(out.assignments).toHaveLength(1);
    expect(out.assignments[0]?.openerUserId).toBe('u1');
    expect(out.assignments[0]?.regularUserId).toBe('u2');
    expect(out.unfilledClassrooms).toEqual([
      { examId: 'e1', index: 1 },
      { examId: 'e1', index: 2 },
    ]);
  });

  it('happy path: persists assignments, marks period scheduled, audits', async () => {
    const o1 = mkUser('u1', ProctorType.Opener, true, 0);
    const o2 = mkUser('u2', ProctorType.Opener, true, 1);
    const r1 = mkUser('u3', ProctorType.Regular, true, 2);
    const period = mkPeriod();
    periods.findById.mockResolvedValue(period);
    exams.findByPeriod.mockResolvedValue([mkExam('e1', 1)]);
    users.findAllProctors.mockResolvedValue([o1, o2, r1]);
    availability.findByExam.mockResolvedValue([
      mkAvailability('u1', 'e1', true),
      mkAvailability('u2', 'e1', true),
      mkAvailability('u3', 'e1', true),
    ]);

    const out = await useCase.execute({ periodId: 'p1', actorId: 'admin' });

    expect(out.assignments).toHaveLength(1);
    expect(out.unfilledClassrooms).toHaveLength(0);
    expect(assignments.replaceForPeriod).toHaveBeenCalledTimes(1);
    expect(period.status).toBe(ExamPeriodStatus.Scheduled);
    expect(periods.save).toHaveBeenCalledWith(period);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin',
        action: 'scheduler.run',
        targetType: 'exam_period',
        targetId: 'p1',
      }),
    );
  });

  it('drops availability rows where available=false even if marked', async () => {
    const o1 = mkUser('u1', ProctorType.Opener, true, 0);
    periods.findById.mockResolvedValue(mkPeriod());
    exams.findByPeriod.mockResolvedValue([mkExam('e1', 1)]);
    users.findAllProctors.mockResolvedValue([o1]);
    availability.findByExam.mockResolvedValue([mkAvailability('u1', 'e1', false)]);

    const out = await useCase.execute({ periodId: 'p1', actorId: 'admin' });

    expect(out.assignments).toHaveLength(0);
    expect(out.unfilledClassrooms).toHaveLength(1);
  });
});
