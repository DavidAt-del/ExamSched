import { inject, injectable } from 'tsyringe';
import { ExamPeriodStatus } from '@app/shared';
import { ExamPeriod } from '../../../../domain/entities/ExamPeriod.js';
import { InvariantViolationError } from '../../../../domain/errors/DomainError.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../../ports/repositories/IExamPeriodRepository.js';
import { IClockToken, type IClock } from '../../../ports/services/IClock.js';
import {
  IIdGeneratorToken,
  type IIdGenerator,
} from '../../../ports/services/IIdGenerator.js';

export interface CreateExamPeriodInput {
  name: string;
  deadline: Date;
  actorId: string;
}

@injectable()
export class CreateExamPeriodUseCase {
  constructor(
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IIdGeneratorToken) private readonly ids: IIdGenerator,
  ) {}

  public async execute(input: CreateExamPeriodInput): Promise<ExamPeriod> {
    const now = this.clock.now();
    if (input.deadline.getTime() <= now.getTime()) {
      throw new InvariantViolationError('Deadline must be in the future');
    }
    const period = new ExamPeriod({
      id: this.ids.next(),
      name: input.name.trim(),
      deadline: input.deadline,
      status: ExamPeriodStatus.Open,
      createdBy: input.actorId,
      createdAt: now,
      updatedAt: now,
    });
    await this.periods.save(period);
    return period;
  }
}
