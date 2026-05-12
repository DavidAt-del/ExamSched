import { inject, injectable } from 'tsyringe';
import {
  NotFoundError,
} from '../../../../domain/errors/DomainError.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../../ports/repositories/IExamPeriodRepository.js';
import { IClockToken, type IClock } from '../../../ports/services/IClock.js';

export interface CloseExamPeriodInput {
  periodId: string;
}

@injectable()
export class CloseExamPeriodUseCase {
  constructor(
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IClockToken) private readonly clock: IClock,
  ) {}

  public async execute(input: CloseExamPeriodInput): Promise<void> {
    const period = await this.periods.findById(input.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');
    period.close(this.clock.now());
    await this.periods.save(period);
  }
}
