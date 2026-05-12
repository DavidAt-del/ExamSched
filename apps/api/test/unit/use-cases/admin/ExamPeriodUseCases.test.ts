import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExamCategory, ExamPeriodStatus } from '@app/shared';
import { CreateExamPeriodUseCase } from '../../../../src/application/use-cases/admin/exam-period/CreateExamPeriodUseCase.js';
import { CloseExamPeriodUseCase } from '../../../../src/application/use-cases/admin/exam-period/CloseExamPeriodUseCase.js';
import { CreateExamUseCase } from '../../../../src/application/use-cases/admin/exam-period/CreateExamUseCase.js';
import { DeleteExamUseCase } from '../../../../src/application/use-cases/admin/exam-period/DeleteExamUseCase.js';
import { ExamPeriod } from '../../../../src/domain/entities/ExamPeriod.js';
import { Exam } from '../../../../src/domain/entities/Exam.js';
import {
  InvariantViolationError,
  NotFoundError,
} from '../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');
const clock = { now: () => fixedNow };
const ids = { next: vi.fn().mockReturnValue('new-id') };

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

describe('CreateExamPeriodUseCase', () => {
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let useCase: CreateExamPeriodUseCase;

  beforeEach(() => {
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    useCase = new CreateExamPeriodUseCase(periods, clock, ids);
  });

  it('rejects a deadline in the past', async () => {
    await expect(
      useCase.execute({
        name: 'Old',
        deadline: new Date(fixedNow.getTime() - 1000),
        actorId: 'admin',
      }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('creates an open period with a future deadline', async () => {
    const out = await useCase.execute({
      name: ' Summer ',
      deadline: new Date(fixedNow.getTime() + 86_400_000),
      actorId: 'admin',
    });
    expect(out.name).toBe('Summer');
    expect(out.status).toBe(ExamPeriodStatus.Open);
    expect(periods.save).toHaveBeenCalledTimes(1);
  });
});

describe('CloseExamPeriodUseCase', () => {
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let useCase: CloseExamPeriodUseCase;

  beforeEach(() => {
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    useCase = new CloseExamPeriodUseCase(periods, clock);
  });

  it('throws NotFound for an unknown period', async () => {
    periods.findById.mockResolvedValue(null);
    await expect(useCase.execute({ periodId: 'x' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('blocks closing a scheduled period', async () => {
    periods.findById.mockResolvedValue(mkPeriod(ExamPeriodStatus.Scheduled));
    await expect(useCase.execute({ periodId: 'p1' })).rejects.toBeInstanceOf(
      InvariantViolationError,
    );
  });

  it('is idempotent when already closed', async () => {
    const period = mkPeriod(ExamPeriodStatus.Closed);
    periods.findById.mockResolvedValue(period);
    await useCase.execute({ periodId: 'p1' });
    // domain close() is a no-op; use case still persists for consistency
    expect(period.status).toBe(ExamPeriodStatus.Closed);
    expect(periods.save).toHaveBeenCalledWith(period);
  });

  it('closes an open period', async () => {
    const period = mkPeriod(ExamPeriodStatus.Open);
    periods.findById.mockResolvedValue(period);
    await useCase.execute({ periodId: 'p1' });
    expect(period.status).toBe(ExamPeriodStatus.Closed);
    expect(periods.save).toHaveBeenCalledWith(period);
  });
});

describe('CreateExamUseCase', () => {
  let exams: { findById: ReturnType<typeof vi.fn>; findOpenForProctor: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let useCase: CreateExamUseCase;

  beforeEach(() => {
    exams = { findById: vi.fn(), findOpenForProctor: vi.fn(), findByPeriod: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    useCase = new CreateExamUseCase(exams, periods, clock, ids);
  });

  it('rejects when period is closed', async () => {
    periods.findById.mockResolvedValue(mkPeriod(ExamPeriodStatus.Closed));
    await expect(
      useCase.execute({
        periodId: 'p1',
        examDate: '2026-06-15',
        startTime: '09:00',
        endTime: '12:00',
        classroomCount: 2,
      }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('rejects when exam date is today', async () => {
    periods.findById.mockResolvedValue(mkPeriod());
    await expect(
      useCase.execute({
        periodId: 'p1',
        examDate: '2026-05-10',
        startTime: '09:00',
        endTime: '12:00',
        classroomCount: 2,
      }),
    ).rejects.toBeInstanceOf(InvariantViolationError);
  });

  it('persists HH:MM:SS times and a positive classroom count', async () => {
    periods.findById.mockResolvedValue(mkPeriod());
    const exam = await useCase.execute({
      periodId: 'p1',
      examDate: '2026-06-15',
      startTime: '09:00',
      endTime: '12:00',
      classroomCount: 4,
    });
    expect(exam.startTime).toBe('09:00:00');
    expect(exam.endTime).toBe('12:00:00');
    expect(exam.classroomCount).toBe(4);
    expect(exams.save).toHaveBeenCalledWith(exam);
  });
});

describe('DeleteExamUseCase', () => {
  let exams: { findById: ReturnType<typeof vi.fn>; findOpenForProctor: ReturnType<typeof vi.fn>; findByPeriod: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let periods: { findById: ReturnType<typeof vi.fn>; findAll: ReturnType<typeof vi.fn>; save: ReturnType<typeof vi.fn>; deleteById: ReturnType<typeof vi.fn> };
  let availability: {
    findByUserAndExam: ReturnType<typeof vi.fn>;
    findByUser: ReturnType<typeof vi.fn>;
    findByExam: ReturnType<typeof vi.fn>;
    countAvailableForExam: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let useCase: DeleteExamUseCase;

  function mkExam(): Exam {
    return new Exam({
      id: 'e1',
      periodId: 'p1',
      examDate: '2026-06-15',
      startTime: '09:00:00',
      endTime: '12:00:00',
      classroomCount: 2,
      category: ExamCategory.Standard,
    });
  }

  beforeEach(() => {
    exams = { findById: vi.fn(), findOpenForProctor: vi.fn(), findByPeriod: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    periods = { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), deleteById: vi.fn() };
    availability = {
      findByUserAndExam: vi.fn(),
      findByUser: vi.fn(),
      findByExam: vi.fn(),
      countAvailableForExam: vi.fn(),
      save: vi.fn(),
    };
    useCase = new DeleteExamUseCase(exams, periods, availability);
  });

  it('blocks delete when proctors have responded', async () => {
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod());
    availability.findByExam.mockResolvedValue([{ id: 'a1' }]);
    await expect(useCase.execute({ examId: 'e1' })).rejects.toBeInstanceOf(
      InvariantViolationError,
    );
    expect(exams.deleteById).not.toHaveBeenCalled();
  });

  it('blocks delete when period is no longer open', async () => {
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod(ExamPeriodStatus.Closed));
    await expect(useCase.execute({ examId: 'e1' })).rejects.toBeInstanceOf(
      InvariantViolationError,
    );
  });

  it('deletes when period is open and no responses exist', async () => {
    exams.findById.mockResolvedValue(mkExam());
    periods.findById.mockResolvedValue(mkPeriod());
    availability.findByExam.mockResolvedValue([]);
    await useCase.execute({ examId: 'e1' });
    expect(exams.deleteById).toHaveBeenCalledWith('e1');
  });
});
