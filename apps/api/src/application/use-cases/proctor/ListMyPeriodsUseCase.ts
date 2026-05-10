import { inject, injectable } from 'tsyringe';
import { ExamPeriodStatus } from '@app/shared';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { Exam } from '../../../domain/entities/Exam.js';
import type { ExamPeriod } from '../../../domain/entities/ExamPeriod.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../ports/repositories/IExamPeriodRepository.js';
import {
  IExamRepositoryToken,
  type IExamRepository,
} from '../../ports/repositories/IExamRepository.js';
import {
  IAvailabilityRepositoryToken,
  type IAvailabilityRepository,
} from '../../ports/repositories/IAvailabilityRepository.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../ports/repositories/IUserRepository.js';
import {
  IAvailabilitySubmissionRepositoryToken,
  type IAvailabilitySubmissionRepository,
} from '../../ports/repositories/IAvailabilitySubmissionRepository.js';

export interface ListMyPeriodsInput {
  userId: string;
}

export interface MyPeriodItem {
  period: ExamPeriod;
  exams: Exam[];
  /** examId → user's availability flag (null = not yet answered). */
  availability: Map<string, boolean>;
  submitted: boolean;
}

/**
 * Period-grouped view of the proctor's relevant work. Includes periods that
 * are open (so they can mark availability), scheduled (visibility / waiting),
 * and sent (their personal schedule lives elsewhere but a Sent badge here is
 * useful). The frontend filters / styles based on `period.status`.
 */
@injectable()
export class ListMyPeriodsUseCase {
  constructor(
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IAvailabilityRepositoryToken)
    private readonly availability: IAvailabilityRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IAvailabilitySubmissionRepositoryToken)
    private readonly submissions: IAvailabilitySubmissionRepository,
  ) {}

  public async execute(input: ListMyPeriodsInput): Promise<MyPeriodItem[]> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');
    if (!user.isProctor()) {
      throw new ForbiddenError('Only proctors can list their availability');
    }

    const allPeriods = await this.periods.findAll();
    const visible = allPeriods.filter((p) => p.status !== ExamPeriodStatus.Closed);

    const [responses, submissions] = await Promise.all([
      this.availability.findByUser(input.userId),
      this.submissions.findByUser(input.userId),
    ]);
    const submittedPeriods = new Set(submissions.map((s) => s.periodId));
    const responseByExamId = new Map(responses.map((r) => [r.examId, r.available]));

    const out: MyPeriodItem[] = [];
    for (const period of visible) {
      const exams = await this.exams.findByPeriod(period.id);
      if (exams.length === 0) continue;
      const availability = new Map<string, boolean>();
      for (const exam of exams) {
        const flag = responseByExamId.get(exam.id);
        if (flag !== undefined) availability.set(exam.id, flag);
      }
      out.push({
        period,
        exams,
        availability,
        submitted: submittedPeriods.has(period.id),
      });
    }
    return out;
  }
}
