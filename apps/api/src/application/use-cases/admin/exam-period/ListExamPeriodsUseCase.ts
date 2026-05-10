import { inject, injectable } from 'tsyringe';
import type { ExamPeriod } from '../../../../domain/entities/ExamPeriod.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../../ports/repositories/IExamPeriodRepository.js';

@injectable()
export class ListExamPeriodsUseCase {
  constructor(
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
  ) {}

  public execute(): Promise<ExamPeriod[]> {
    return this.periods.findAll();
  }
}
