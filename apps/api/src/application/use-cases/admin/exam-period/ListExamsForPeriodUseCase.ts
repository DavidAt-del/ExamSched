import { inject, injectable } from 'tsyringe';
import type { Exam } from '../../../../domain/entities/Exam.js';
import { NotFoundError } from '../../../../domain/errors/DomainError.js';
import {
  IExamRepositoryToken,
  type IExamRepository,
} from '../../../ports/repositories/IExamRepository.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../../ports/repositories/IExamPeriodRepository.js';

export interface ListExamsForPeriodInput {
  periodId: string;
}

@injectable()
export class ListExamsForPeriodUseCase {
  constructor(
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
  ) {}

  public async execute(input: ListExamsForPeriodInput): Promise<Exam[]> {
    const period = await this.periods.findById(input.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');
    return this.exams.findByPeriod(input.periodId);
  }
}
