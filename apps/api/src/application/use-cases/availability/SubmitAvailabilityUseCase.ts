import { inject, injectable } from 'tsyringe';
import { Availability } from '../../../domain/entities/Availability.js';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import {
  IAvailabilityRepositoryToken,
  type IAvailabilityRepository,
} from '../../ports/repositories/IAvailabilityRepository.js';
import {
  IExamRepositoryToken,
  type IExamRepository,
} from '../../ports/repositories/IExamRepository.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../ports/repositories/IExamPeriodRepository.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../ports/repositories/IUserRepository.js';
import { IClockToken, type IClock } from '../../ports/services/IClock.js';
import { IIdGeneratorToken, type IIdGenerator } from '../../ports/services/IIdGenerator.js';

export interface SubmitAvailabilityInput {
  userId: string;
  examId: string;
  available: boolean;
}

@injectable()
export class SubmitAvailabilityUseCase {
  constructor(
    @inject(IAvailabilityRepositoryToken)
    private readonly availabilityRepo: IAvailabilityRepository,
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IExamPeriodRepositoryToken) private readonly periods: IExamPeriodRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IIdGeneratorToken) private readonly ids: IIdGenerator,
  ) {}

  public async execute(input: SubmitAvailabilityInput): Promise<Availability> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');
    if (!user.isProctor()) {
      throw new ForbiddenError('Only proctors can submit availability');
    }

    const exam = await this.exams.findById(input.examId);
    if (!exam) throw new NotFoundError('Exam');

    const period = await this.periods.findById(exam.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');

    const now = this.clock.now();
    period.ensureAcceptingAvailability(now);

    const existing = await this.availabilityRepo.findByUserAndExam(input.userId, input.examId);
    if (existing) {
      existing.update(input.available, now);
      await this.availabilityRepo.save(existing);
      return existing;
    }

    const created = new Availability({
      id: this.ids.next(),
      userId: input.userId,
      examId: input.examId,
      available: input.available,
      submittedAt: now,
    });
    await this.availabilityRepo.save(created);
    return created;
  }
}
