import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExamPeriodStatus,
  NotificationStatus,
  ProctorType,
  UserRole,
} from '@app/shared';
import { SendSchedulesUseCase } from '../../../../src/application/use-cases/notifications/SendSchedulesUseCase.js';
import { Assignment } from '../../../../src/domain/entities/Assignment.js';
import { Exam } from '../../../../src/domain/entities/Exam.js';
import { ExamPeriod } from '../../../../src/domain/entities/ExamPeriod.js';
import { User } from '../../../../src/domain/entities/User.js';
import { NationalId } from '../../../../src/domain/value-objects/NationalId.js';
import {
  InvariantViolationError,
  NotFoundError,
} from '../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');
const validIds = [
  '000000018',
  '000000026',
  '000000034',
  '000000042',
  '000000059',
];

function mkPeriod(status: ExamPeriodStatus = ExamPeriodStatus.Scheduled): ExamPeriod {
  return new ExamPeriod({
    id: 'p1',
    name: 'Summer 2026',
    deadline: new Date('2026-06-01T00:00:00Z'),
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

function mkAssignment(opts: { openerUserId: string; regularUserId: string | null }): Assignment {
  return new Assignment({
    id: 'asg-1',
    examId: 'e1',
    classroomIndex: 0,
    openerUserId: opts.openerUserId,
    regularUserId: opts.regularUserId,
    manualOverride: false,
    notes: null,
  });
}

function mkUser(opts: {
  id: string;
  email: string | null;
  proctorType?: ProctorType;
  active?: boolean;
}): User {
  const idx = Math.abs(opts.id.split('').reduce((s, c) => s + c.charCodeAt(0), 0)) % validIds.length;
  return new User({
    id: opts.id,
    nationalId: NationalId.create(validIds[idx]!),
    firstName: 'F',
    lastName: opts.id,
    email: opts.email,
    phone: null,
    passwordHash: 'h',
    role: UserRole.Proctor,
    proctorType: opts.proctorType ?? ProctorType.Opener,
    mustChangePassword: false,
    active: opts.active ?? true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

describe('SendSchedulesUseCase', () => {
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let exams: { findById: ReturnType<typeof vi.fn>; findOpenForProctor: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let users: { findById: ReturnType<typeof vi.fn>; findByNationalId: ReturnType<typeof vi.fn>; findAllProctors: ReturnType<typeof vi.fn>; findAllStaff: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deactivate: ReturnType<typeof vi.fn> };
  let assignments: { findByExam: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; findByUser: ReturnType<typeof vi.fn>; hasFutureForUser: ReturnType<typeof vi.fn>; replaceForExam: ReturnType<typeof vi.fn>; replaceForPeriod: ReturnType<typeof vi.fn>; findByExamAndClassroom: ReturnType<typeof vi.fn>; saveOne: ReturnType<typeof vi.fn> };
  let notifLog: { write: ReturnType<typeof vi.fn> };
  let email: { send: ReturnType<typeof vi.fn> };
  let emailBuilder: { build: ReturnType<typeof vi.fn> };
  let audit: { log: ReturnType<typeof vi.fn> };
  let useCase: SendSchedulesUseCase;
  let nextIdCount = 0;
  const ids = { next: vi.fn(() => `notif-${++nextIdCount}`) };

  beforeEach(() => {
    nextIdCount = 0;
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    exams = { findById: vi.fn(), findOpenForProctor: vi.fn(), findByPeriod: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    users = { findById: vi.fn(), findByNationalId: vi.fn(), findAllProctors: vi.fn(), findAllStaff: vi.fn(), save: vi.fn(), deactivate: vi.fn() };
    assignments = { findByExam: vi.fn(), findByPeriod: vi.fn(), findByUser: vi.fn(), hasFutureForUser: vi.fn(), replaceForExam: vi.fn(), replaceForPeriod: vi.fn(), findByExamAndClassroom: vi.fn(), saveOne: vi.fn() };
    notifLog = { write: vi.fn() };
    email = { send: vi.fn() };
    emailBuilder = {
      build: vi.fn((input: { user: { email: string | null }; period: { name: string }; items: unknown[] }) => ({
        to: input.user.email ?? 'unused',
        subject: `subject for ${input.period.name}`,
        htmlBody: `body with ${input.items.length} items`,
      })),
    };
    audit = { log: vi.fn() };
    useCase = new SendSchedulesUseCase(
      periods,
      exams,
      users,
      assignments,
      notifLog,
      email,
      emailBuilder,
      { now: () => fixedNow },
      ids,
      audit,
    );
  });

  it('rejects unknown period with NotFound', async () => {
    periods.findById.mockResolvedValue(null);
    await expect(
      useCase.execute({ actorId: 'admin', periodId: 'p1' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects when period is not in scheduled status', async () => {
    periods.findById.mockResolvedValue(mkPeriod(ExamPeriodStatus.Open));
    await expect(
      useCase.execute({ actorId: 'admin', periodId: 'p1' }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('rejects when period is already sent', async () => {
    periods.findById.mockResolvedValue(mkPeriod(ExamPeriodStatus.Sent));
    await expect(
      useCase.execute({ actorId: 'admin', periodId: 'p1' }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('skips users without an email and writes a failed log row', async () => {
    const opener = mkUser({ id: 'u1', email: null });
    const period = mkPeriod();
    periods.findById.mockResolvedValue(period);
    exams.findByPeriod.mockResolvedValue([mkExam()]);
    assignments.findByPeriod.mockResolvedValue([
      mkAssignment({ openerUserId: 'u1', regularUserId: null }),
    ]);
    users.findById.mockImplementation(async (id: string) =>
      id === 'u1' ? opener : null,
    );

    const result = await useCase.execute({ actorId: 'admin', periodId: 'p1' });

    expect(result).toEqual({ sent: 0, skipped: 1, failed: 0 });
    expect(email.send).not.toHaveBeenCalled();
    expect(notifLog.write).toHaveBeenCalledWith(
      expect.objectContaining({ status: NotificationStatus.Failed, error: 'no email' }),
    );
    expect(period.status).toBe(ExamPeriodStatus.Sent);
    expect(periods.save).toHaveBeenCalledWith(period);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'schedule.sent' }),
    );
  });

  it("counts a single user's failure without aborting the others", async () => {
    const opener = mkUser({ id: 'u1', email: 'a@example.com' });
    const regular = mkUser({ id: 'u2', email: 'b@example.com', proctorType: ProctorType.Regular });
    periods.findById.mockResolvedValue(mkPeriod());
    exams.findByPeriod.mockResolvedValue([mkExam()]);
    assignments.findByPeriod.mockResolvedValue([
      mkAssignment({ openerUserId: 'u1', regularUserId: 'u2' }),
    ]);
    users.findById.mockImplementation(async (id: string) =>
      id === 'u1' ? opener : id === 'u2' ? regular : null,
    );
    email.send
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('SMTP boom'));

    const result = await useCase.execute({ actorId: 'admin', periodId: 'p1' });

    expect(result.sent).toBe(1);
    expect(result.failed).toBe(1);
    expect(notifLog.write).toHaveBeenCalledWith(
      expect.objectContaining({ status: NotificationStatus.Sent }),
    );
    expect(notifLog.write).toHaveBeenCalledWith(
      expect.objectContaining({ status: NotificationStatus.Failed, error: 'SMTP boom' }),
    );
  });

  it('respects the userIds whitelist', async () => {
    const opener = mkUser({ id: 'u1', email: 'a@example.com' });
    const regular = mkUser({ id: 'u2', email: 'b@example.com', proctorType: ProctorType.Regular });
    periods.findById.mockResolvedValue(mkPeriod());
    exams.findByPeriod.mockResolvedValue([mkExam()]);
    assignments.findByPeriod.mockResolvedValue([
      mkAssignment({ openerUserId: 'u1', regularUserId: 'u2' }),
    ]);
    users.findById.mockImplementation(async (id: string) =>
      id === 'u1' ? opener : id === 'u2' ? regular : null,
    );
    email.send.mockResolvedValue(undefined);

    const result = await useCase.execute({
      actorId: 'admin',
      periodId: 'p1',
      userIds: ['u1'],
    });

    expect(result.sent).toBe(1);
    expect(email.send).toHaveBeenCalledTimes(1);
    expect(emailBuilder.build).toHaveBeenCalledWith(
      expect.objectContaining({ user: opener }),
    );
  });

  it('uses the user as their own partner reference when they are both opener and regular across rows', async () => {
    const opener = mkUser({ id: 'u1', email: 'a@example.com' });
    const regular = mkUser({ id: 'u2', email: 'b@example.com', proctorType: ProctorType.Regular });
    periods.findById.mockResolvedValue(mkPeriod());
    exams.findByPeriod.mockResolvedValue([mkExam()]);
    assignments.findByPeriod.mockResolvedValue([
      mkAssignment({ openerUserId: 'u1', regularUserId: 'u2' }),
    ]);
    users.findById.mockImplementation(async (id: string) =>
      id === 'u1' ? opener : id === 'u2' ? regular : null,
    );
    email.send.mockResolvedValue(undefined);

    await useCase.execute({ actorId: 'admin', periodId: 'p1' });

    // Opener should see regular as their partner; regular should see opener.
    const buildCalls = emailBuilder.build.mock.calls.map((c) => {
      const arg = c[0] as { user: User; items: { partner: User | null }[] };
      const firstItem = arg.items[0];
      return {
        user: arg.user.id,
        partner: firstItem?.partner?.id ?? null,
      };
    });
    expect(buildCalls).toContainEqual({ user: 'u1', partner: 'u2' });
    expect(buildCalls).toContainEqual({ user: 'u2', partner: 'u1' });
  });
});
