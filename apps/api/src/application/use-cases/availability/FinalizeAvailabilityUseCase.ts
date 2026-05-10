import { inject, injectable } from 'tsyringe';
import { ExamPeriodStatus } from '@app/shared';
import { AvailabilitySubmission } from '../../../domain/entities/AvailabilitySubmission.js';
import {
  NotFoundError,
  PeriodLockedError,
} from '../../../domain/errors/DomainError.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../ports/repositories/IExamPeriodRepository.js';
import {
  IAvailabilitySubmissionRepositoryToken,
  type IAvailabilitySubmissionRepository,
} from '../../ports/repositories/IAvailabilitySubmissionRepository.js';
import { IClockToken, type IClock } from '../../ports/services/IClock.js';
import {
  IIdGeneratorToken,
  type IIdGenerator,
} from '../../ports/services/IIdGenerator.js';
import {
  IAuditLoggerToken,
  type IAuditLogger,
} from '../../ports/services/IAuditLogger.js';

export interface FinalizeAvailabilityInput {
  userId: string;
  periodId: string;
}

@injectable()
export class FinalizeAvailabilityUseCase {
  constructor(
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IAvailabilitySubmissionRepositoryToken)
    private readonly submissions: IAvailabilitySubmissionRepository,
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IIdGeneratorToken) private readonly ids: IIdGenerator,
    @inject(IAuditLoggerToken) private readonly audit: IAuditLogger,
  ) {}

  public async execute(input: FinalizeAvailabilityInput): Promise<AvailabilitySubmission> {
    const period = await this.periods.findById(input.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');

    const now = this.clock.now();
    if (period.status !== ExamPeriodStatus.Open) {
      throw new PeriodLockedError(
        'Availability can only be submitted while the period is open',
      );
    }
    if (now.getTime() > period.deadline.getTime()) {
      throw new PeriodLockedError('Availability submission deadline has passed');
    }

    const existing = await this.submissions.find(input.userId, input.periodId);
    if (existing) return existing; // idempotent

    const submission = new AvailabilitySubmission({
      id: this.ids.next(),
      userId: input.userId,
      periodId: input.periodId,
      submittedAt: now,
    });
    await this.submissions.save(submission);

    await this.audit.log({
      actorId: input.userId,
      action: 'availability.finalized',
      targetType: 'exam_period',
      targetId: input.periodId,
    });

    return submission;
  }
}
