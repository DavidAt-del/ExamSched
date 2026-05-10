import { inject, injectable } from 'tsyringe';
import { ExamPeriodStatus } from '@app/shared';
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
import {
  IAvailabilityRepositoryToken,
  type IAvailabilityRepository,
} from '../../../ports/repositories/IAvailabilityRepository.js';

export interface DeleteExamInput {
  examId: string;
}

@injectable()
export class DeleteExamUseCase {
  constructor(
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IAvailabilityRepositoryToken)
    private readonly availability: IAvailabilityRepository,
  ) {}

  public async execute(input: DeleteExamInput): Promise<void> {
    const exam = await this.exams.findById(input.examId);
    if (!exam) throw new NotFoundError('Exam');

    const period = await this.periods.findById(exam.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');
    if (period.status !== ExamPeriodStatus.Open) {
      throw new InvariantViolationError(
        'Exams can only be deleted from a period in the "open" status',
      );
    }

    // Refuse to drop an exam that proctors have already responded to.
    const responses = await this.availability.findByExam(input.examId);
    if (responses.length > 0) {
      throw new InvariantViolationError(
        'Cannot delete an exam that proctors have already responded to',
      );
    }

    await this.exams.deleteById(input.examId);
  }
}
