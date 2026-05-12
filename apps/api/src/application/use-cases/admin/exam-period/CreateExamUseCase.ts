import { inject, injectable } from 'tsyringe';
import { ExamCategory, ExamPeriodStatus } from '@app/shared';
import { Exam } from '../../../../domain/entities/Exam.js';
import {
  InvariantViolationError,
  NotFoundError,
} from '../../../../domain/errors/DomainError.js';
import {
  IExamRepositoryToken,
  type IExamRepository,
} from '../../../ports/repositories/IExamRepository.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../../ports/repositories/IExamPeriodRepository.js';
import { IClockToken, type IClock } from '../../../ports/services/IClock.js';
import {
  IIdGeneratorToken,
  type IIdGenerator,
} from '../../../ports/services/IIdGenerator.js';

export interface CreateExamInput {
  periodId: string;
  examDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM (no seconds)
  endTime: string; // HH:MM
  classroomCount: number;
  category?: ExamCategory;
}

@injectable()
export class CreateExamUseCase {
  constructor(
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IIdGeneratorToken) private readonly ids: IIdGenerator,
  ) {}

  public async execute(input: CreateExamInput): Promise<Exam> {
    const period = await this.periods.findById(input.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');
    if (period.status !== ExamPeriodStatus.Open) {
      throw new InvariantViolationError(
        'Exams can only be added to a period in the "open" status',
      );
    }
    const todayIso = this.clock.now().toISOString().slice(0, 10);
    if (input.examDate <= todayIso) {
      throw new InvariantViolationError('Exam date must be later than today');
    }

    const exam = new Exam({
      id: this.ids.next(),
      periodId: input.periodId,
      examDate: input.examDate,
      // Persist HH:MM:SS for symmetry with the database `time` type.
      startTime: `${input.startTime}:00`,
      endTime: `${input.endTime}:00`,
      classroomCount: input.classroomCount,
      category: input.category ?? ExamCategory.Standard,
    });
    await this.exams.save(exam);
    return exam;
  }
}
