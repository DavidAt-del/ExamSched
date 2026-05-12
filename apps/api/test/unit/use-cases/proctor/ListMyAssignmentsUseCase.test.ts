import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamCategory, ExamPeriodStatus, ProctorType, UserRole } from '@app/shared';
import { ListMyAssignmentsUseCase } from '../../../../src/application/use-cases/proctor/ListMyAssignmentsUseCase.js';
import { Assignment } from '../../../../src/domain/entities/Assignment.js';
import { Exam } from '../../../../src/domain/entities/Exam.js';
import { ExamPeriod } from '../../../../src/domain/entities/ExamPeriod.js';
import { User } from '../../../../src/domain/entities/User.js';
import { NationalId } from '../../../../src/domain/value-objects/NationalId.js';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');
const validIds = ['000000018', '000000026', '000000034', '000000042'];

function mkUser(opts: { id: string; role?: UserRole; type?: ProctorType | null; nidIndex?: number }): User {
  return new User({
    id: opts.id,
    nationalId: NationalId.create(validIds[opts.nidIndex ?? 0]!),
    firstName: 'F',
    lastName: opts.id,
    email: null,
    phone: null,
    passwordHash: 'h',
    role: opts.role ?? UserRole.Proctor,
    proctorType:
      opts.type === undefined ? ProctorType.Opener : opts.type,
    mustChangePassword: false,
    active: true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

function mkPeriod(id: string, status: ExamPeriodStatus): ExamPeriod {
  return new ExamPeriod({
    id,
    name: id,
    deadline: new Date('2026-09-01T00:00:00Z'),
    status,
    createdBy: 'admin',
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

function mkExam(id: string, periodId: string): Exam {
  return new Exam({
    id,
    periodId,
    examDate: '2026-06-15',
    startTime: '09:00:00',
    endTime: '12:00:00',
    classroomCount: 1,
    category: ExamCategory.Standard,
  });
}

function mkAssignment(opts: {
  id: string;
  examId: string;
  openerUserId: string;
  regularUserId: string | null;
}): Assignment {
  return new Assignment({
    id: opts.id,
    examId: opts.examId,
    classroomIndex: 0,
    openerUserId: opts.openerUserId,
    regularUserId: opts.regularUserId,
    manualOverride: false,
    notes: null,
  });
}

describe('ListMyAssignmentsUseCase', () => {
  let assignments: { findByExam: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; findByUser: ReturnType<typeof vi.fn>; hasFutureForUser: ReturnType<typeof vi.fn>; replaceForExam: ReturnType<typeof vi.fn>; replaceForPeriod: ReturnType<typeof vi.fn>; findByExamAndClassroom: ReturnType<typeof vi.fn>; saveOne: ReturnType<typeof vi.fn> };
  let exams: { findById: ReturnType<typeof vi.fn>; findOpenForProctor: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let users: { findById: ReturnType<typeof vi.fn>; findByNationalId: ReturnType<typeof vi.fn>; findAllProctors: ReturnType<typeof vi.fn>; findAllStaff: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn> };
  let useCase: ListMyAssignmentsUseCase;

  beforeEach(() => {
    assignments = { findByExam: vi.fn(), findByPeriod: vi.fn(), findByUser: vi.fn(), hasFutureForUser: vi.fn(), replaceForExam: vi.fn(), replaceForPeriod: vi.fn(), findByExamAndClassroom: vi.fn(), saveOne: vi.fn() };
    exams = { findById: vi.fn(), findOpenForProctor: vi.fn(), findByPeriod: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    users = { findById: vi.fn(), findByNationalId: vi.fn(), findAllProctors: vi.fn(), findAllStaff: vi.fn(), save: vi.fn(), deactivate: vi.fn() };
    useCase = new ListMyAssignmentsUseCase(assignments, exams, periods, users);
  });

  it('rejects unknown user with NotFound', async () => {
    users.findById.mockResolvedValue(null);
    await expect(useCase.execute({ userId: 'u1' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('rejects non-proctor users', async () => {
    users.findById.mockResolvedValue(
      mkUser({ id: 'staff', role: UserRole.ExamStaff, type: null }),
    );
    await expect(useCase.execute({ userId: 'staff' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('returns empty array when the user has no assignments', async () => {
    users.findById.mockResolvedValue(mkUser({ id: 'u1' }));
    assignments.findByUser.mockResolvedValue([]);
    expect(await useCase.execute({ userId: 'u1' })).toEqual([]);
  });

  it('filters out assignments whose period is not yet sent', async () => {
    const me = mkUser({ id: 'u1' });
    users.findById.mockImplementation(async (id: string) =>
      id === 'u1' ? me : null,
    );
    assignments.findByUser.mockResolvedValue([
      mkAssignment({ id: 'a1', examId: 'e1', openerUserId: 'u1', regularUserId: null }),
    ]);
    exams.findById.mockResolvedValue(mkExam('e1', 'p1'));
    periods.findById.mockResolvedValue(mkPeriod('p1', ExamPeriodStatus.Scheduled));

    expect(await useCase.execute({ userId: 'u1' })).toEqual([]);
  });

  it('hydrates partner data for both opener and regular roles', async () => {
    const me = mkUser({ id: 'u1', nidIndex: 0 });
    const partner = mkUser({ id: 'u2', nidIndex: 1, type: ProctorType.Regular });
    users.findById.mockImplementation(async (id: string) =>
      id === 'u1' ? me : id === 'u2' ? partner : null,
    );
    assignments.findByUser.mockResolvedValue([
      mkAssignment({ id: 'a1', examId: 'e1', openerUserId: 'u1', regularUserId: 'u2' }),
      mkAssignment({ id: 'a2', examId: 'e2', openerUserId: 'u2', regularUserId: 'u1' }),
    ]);
    exams.findById.mockImplementation(async (id: string) => mkExam(id, 'p1'));
    periods.findById.mockResolvedValue(mkPeriod('p1', ExamPeriodStatus.Sent));

    const out = await useCase.execute({ userId: 'u1' });

    expect(out).toHaveLength(2);
    const opener = out.find((i) => i.examId === 'e1');
    const regular = out.find((i) => i.examId === 'e2');
    expect(opener?.role).toBe('opener');
    expect(opener?.partner?.id).toBe('u2');
    expect(regular?.role).toBe('regular');
    expect(regular?.partner?.id).toBe('u2');
  });

  it('returns null partner on solo opener assignments', async () => {
    const me = mkUser({ id: 'u1' });
    users.findById.mockResolvedValue(me);
    assignments.findByUser.mockResolvedValue([
      mkAssignment({ id: 'a1', examId: 'e1', openerUserId: 'u1', regularUserId: null }),
    ]);
    exams.findById.mockResolvedValue(mkExam('e1', 'p1'));
    periods.findById.mockResolvedValue(mkPeriod('p1', ExamPeriodStatus.Sent));

    const out = await useCase.execute({ userId: 'u1' });
    expect(out[0]?.partner).toBeNull();
  });
});
