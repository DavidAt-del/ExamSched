import { inject, injectable } from 'tsyringe';
import { ExamPeriodStatus } from '@app/shared';
import {
  InvariantViolationError,
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
    if (
      period.status === ExamPeriodStatus.Scheduled ||
      period.status === ExamPeriodStatus.Sent
    ) {
      throw new InvariantViolationError(
        'Cannot close a period that has already been scheduled or sent',
      );
    }
    if (period.status === ExamPeriodStatus.Closed) return; // idempotent
    period.status = ExamPeriodStatus.Closed;
    period.updatedAt = this.clock.now();
    await this.periods.save(period);
  }
}
