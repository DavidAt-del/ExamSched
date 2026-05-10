import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamPeriodStatus, ProctorType, UserRole } from '@app/shared';
import { ManualOverrideAssignmentUseCase } from '../../../../src/application/use-cases/scheduling/ManualOverrideAssignmentUseCase.js';
import { Assignment } from '../../../../src/domain/entities/Assignment.js';
import { Exam } from '../../../../src/domain/entities/Exam.js';
import { ExamPeriod } from '../../../../src/domain/entities/ExamPeriod.js';
import { User } from '../../../../src/domain/entities/User.js';
import { NationalId } from '../../../../src/domain/value-objects/NationalId.js';
import {
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
} from '../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');
const idA = '000000018';
const idB = '000000026';

function mkPeriod(status: ExamPeriodStatus = ExamPeriodStatus.Scheduled): ExamPeriod {
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

function mkExam(): Exam {
  return new Exam({
    id: 'e1',
    periodId: 'p1',
    examDate: '2026-06-15',
    startTime: '09:00:00',
    endTime: '12:00:00',
    classroomCount: 1,
  });
}

function mkAssignment(): Assignment {
  return new Assignment({
    id: 'asg-1',
    examId: 'e1',
    classroomIndex: 0,
    openerUserId: 'u-old-opener',
    regularUserId: 'u-old-regular',
    manualOverride: false,
    notes: null,
  });
}

function mkUser(
  id: string,
  role: UserRole,
  type: ProctorType | null,
  active = true,
  nationalId = idA,
): User {
  return new User({
    id,
    nationalId: NationalId.create(nationalId),
    firstName: 'F',
    lastName: id,
    email: null,
    phone: null,
    passwordHash: 'h',
    role,
    proctorType: type,
    mustChangePassword: false,
    active,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

describe('ManualOverrideAssignmentUseCase', () => {
  let exams: { findById: ReturnType<typeof vi.fn>; findOpenForProctor: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let users: { findById: ReturnType<typeof vi.fn>; findByNationalId: ReturnType<typeof vi.fn>; findAllProctors: ReturnType<typeof vi.fn>; findAllStaff: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn> };
  let assignments: { findByExam: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; findByUser: ReturnType<typeof vi.fn>; hasFutureForUser: ReturnType<typeof vi.fn>; replaceForExam: ReturnType<typeof vi.fn>; replaceForPeriod: ReturnType<typeof vi.fn>; findByExamAndClassroom: ReturnType<typeof vi.fn>; saveOne: ReturnType<typeof vi.fn> };
  let audit: { log: ReturnType<typeof vi.fn> };
  let useCase: ManualOverrideAssignmentUseCase;

  beforeEach(() => {
    exams = { findById: vi.fn(), findOpenForProctor: vi.fn(), findByPeriod: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    users = { findById: vi.fn(), findByNationalId: vi.fn(), findAllProctors: vi.fn(), findAllStaff: vi.fn(), save: vi.fn(), deactivate: vi.fn() };
    assignments = { findByExam: vi.fn(), findByPeriod: vi.fn(), findByUser: vi.fn(), hasFutureForUser: vi.fn(), replaceForExam: vi.fn(), replaceForPeriod: vi.fn(), findByExamAndClassroom: vi.fn(), saveOne: vi.fn() };
    audit = { log: vi.fn() };
    useCase = new ManualOverrideAssignmentUseCase(exams, periods, users, assignments, audit);
  });

  it('rejects when opener and regular are the same user', async () => {
    await expect(
      useCase.execute({
        actorId: 'admin',
        examId: 'e1',
        classroomIndex: 0,
        openerUserId: 'same-id',
        regularUserId: 'same-id',
        notes: null,
      }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('rejects when the exam does not exist', async () => {
    exams.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({
        actorId: 'admin',
        examId: 'e1',
        classroomIndex: 0,
        openerUserId: 'u-opener',
        regularUserId: null,
        notes: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects when the period has already been sent', async () => {
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod(ExamPeriodStatus.Sent));
    await expect(
      useCase.execute({
        actorId: 'admin',
        examId: 'e1',
        classroomIndex: 0,
        openerUserId: 'u-opener',
        regularUserId: null,
        notes: null,
      }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('rejects when no assignment exists at that classroom (run scheduler first)', async () => {
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod());
    assignments.findByExamAndClassroom.mockResolvedValue(null);
    await expect(
      useCase.execute({
        actorId: 'admin',
        examId: 'e1',
        classroomIndex: 0,
        openerUserId: 'u-opener',
        regularUserId: null,
        notes: null,
      }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects an opener slot filled by a non-opener proctor', async () => {
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod());
    assignments.findByExamAndClassroom.mockResolvedValue(mkAssignment());
    users.findById.mockResolvedValueOnce(
      mkUser('u-opener', UserRole.Proctor, ProctorType.Regular),
    );
    await expect(
      useCase.execute({
        actorId: 'admin',
        examId: 'e1',
        classroomIndex: 0,
        openerUserId: 'u-opener',
        regularUserId: null,
        notes: null,
      }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('rejects an inactive opener', async () => {
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod());
    assignments.findByExamAndClassroom.mockResolvedValue(mkAssignment());
    users.findById.mockResolvedValueOnce(
      mkUser('u-opener', UserRole.Proctor, ProctorType.Opener, false),
    );
    await expect(
      useCase.execute({
        actorId: 'admin',
        examId: 'e1',
        classroomIndex: 0,
        openerUserId: 'u-opener',
        regularUserId: null,
        notes: null,
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('saves the override on the happy path and audits', async () => {
    const existing = mkAssignment();
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod());
    assignments.findByExamAndClassroom.mockResolvedValue(existing);
    users.findById
      .mockResolvedValueOnce(mkUser('u-new-opener', UserRole.Proctor, ProctorType.Opener, true, idA))
      .mockResolvedValueOnce(mkUser('u-new-regular', UserRole.Proctor, ProctorType.Regular, true, idB));

    const out = await useCase.execute({
      actorId: 'admin',
      examId: 'e1',
      classroomIndex: 0,
      openerUserId: 'u-new-opener',
      regularUserId: 'u-new-regular',
      notes: 'special needs accommodation',
    });

    expect(out.openerUserId).toBe('u-new-opener');
    expect(out.regularUserId).toBe('u-new-regular');
    expect(out.manualOverride).toBe(true);
    expect(out.notes).toBe('special needs accommodation');
    expect(assignments.saveOne).toHaveBeenCalledWith(existing);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'assignment.manual_override',
        targetType: 'assignment',
      }),
    );
  });
});
