import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, ProctorType, ExamPeriodStatus } from '@app/shared';
import { SubmitAvailabilityUseCase } from '../../../src/application/use-cases/availability/SubmitAvailabilityUseCase.js';
import { User } from '../../../src/domain/entities/User.js';
import { NationalId } from '../../../src/domain/value-objects/NationalId.js';
import { Exam } from '../../../src/domain/entities/Exam.js';
import { ExamPeriod } from '../../../src/domain/entities/ExamPeriod.js';
import {
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
} from '../../../src/domain/errors/DomainError.js';

function mkProctor() {
  return new User({
    id: 'u1',
    nationalId: NationalId.create('000000018'),
    firstName: 'D',
    lastName: 'C',
    email: null,
    phone: null,
    passwordHash: 'h',
    role: UserRole.Proctor,
    proctorType: ProctorType.Opener,
    mustChangePassword: false,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function mkExam() {
  return new Exam({
    id: 'e1',
    periodId: 'p1',
    examDate: '2026-06-01',
    startTime: '09:00:00',
    endTime: '12:00:00',
    classroomCount: 2,
  });
}

function mkPeriod(deadline: Date, status: typeof ExamPeriodStatus[keyof typeof ExamPeriodStatus] = ExamPeriodStatus.Open) {
  return new ExamPeriod({
    id: 'p1',
    name: 'Summer',
    deadline,
    status,
    createdBy: 'admin',
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('SubmitAvailabilityUseCase', () => {
  const ids = { next: vi.fn().mockReturnValue('a1') };
  const fixedNow = new Date('2026-05-10T10:00:00Z');
  const clock = { now: () => fixedNow };

  let availability: { findByUserAndExam: ReturnType<typeof vi.fn>; findByUser: ReturnType<typeof vi.fn>; findByExam: ReturnType<typeof vi.fn>; countAvailableForExam: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn> };
  let exams: { findById: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; findOpenForProctor: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let users: { findById: ReturnType<typeof vi.fn>; findByNationalId: ReturnType<typeof vi.fn>; findAllProctors: ReturnType<typeof vi.fn>; findAllStaff: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn> };
  let useCase: SubmitAvailabilityUseCase;

  beforeEach(() => {
    availability = { findByUserAndExam: vi.fn(), findByUser: vi.fn(), findByExam: vi.fn(), countAvailableForExam: vi.fn(), save: vi.fn() };
    exams = { findById: vi.fn(), save: vi.fn(), findOpenForProctor: vi.fn(), findByPeriod: vi.fn(), deleteById: vi.fn() };
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    users = { findById: vi.fn(), findByNationalId: vi.fn(), findAllProctors: vi.fn(), findAllStaff: vi.fn(), save: vi.fn(), deactivate: vi.fn() };
    useCase = new SubmitAvailabilityUseCase(
      availability,
      exams,
      periods,
      users,
      clock,
      ids,
    );
  });

  it('rejects non-proctor users', async () => {
    users.findById.mockResolvedValue(
      new User({
        id: 'staff',
        nationalId: NationalId.create('000000018'),
        firstName: 'S',
        lastName: 'T',
        email: null,
        phone: null,
        passwordHash: 'h',
        role: UserRole.ExamStaff,
        proctorType: null,
        mustChangePassword: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
    await expect(
      useCase.execute({ userId: 'staff', examId: 'e1', available: true }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('throws NotFound for missing exam', async () => {
    users.findById.mockResolvedValue(mkProctor());
    exams.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ userId: 'u1', examId: 'e1', available: true }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects when period is closed', async () => {
    users.findById.mockResolvedValue(mkProctor());
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(
      mkPeriod(new Date('2026-12-01'), ExamPeriodStatus.Closed),
    );
    await expect(
      useCase.execute({ userId: 'u1', examId: 'e1', available: true }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('rejects when past deadline', async () => {
    users.findById.mockResolvedValue(mkProctor());
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod(new Date('2026-05-09T00:00:00Z')));
    await expect(
      useCase.execute({ userId: 'u1', examId: 'e1', available: true }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('creates a new availability when none exists', async () => {
    users.findById.mockResolvedValue(mkProctor());
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod(new Date('2026-12-01')));
    availability.findByUserAndExam.mockResolvedValue(null);

    const result = await useCase.execute({ userId: 'u1', examId: 'e1', available: true });

    expect(result.id).toBe('a1');
    expect(result.available).toBe(true);
    expect(availability.save).toHaveBeenCalledTimes(1);
  });

  it('updates an existing availability', async () => {
    users.findById.mockResolvedValue(mkProctor());
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod(new Date('2026-12-01')));
    const existing = {
      id: 'a-existing',
      userId: 'u1',
      examId: 'e1',
      available: false,
      submittedAt: new Date('2026-04-01T00:00:00Z'),
      update: vi.fn(function (this: { available: boolean; submittedAt: Date }, av: boolean, when: Date) {
        this.available = av;
        this.submittedAt = when;
      }),
    };
    availability.findByUserAndExam.mockResolvedValue(existing);

    const result = await useCase.execute({ userId: 'u1', examId: 'e1', available: true });

    expect(existing.update).toHaveBeenCalledWith(true, fixedNow);
    expect(result).toBe(existing);
    expect(availability.save).toHaveBeenCalledWith(existing);
  });
});
