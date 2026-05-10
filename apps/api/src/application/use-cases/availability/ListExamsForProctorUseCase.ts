import { inject, injectable } from 'tsyringe';
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
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { Exam } from '../../../domain/entities/Exam.js';

export interface ListExamsForProctorInput {
  userId: string;
}

export interface ProctorExamItem {
  exam: Exam;
  myAvailability: boolean | null;
}

@injectable()
export class ListExamsForProctorUseCase {
  constructor(
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IAvailabilityRepositoryToken)
    private readonly availability: IAvailabilityRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
  ) {}

  public async execute(input: ListExamsForProctorInput): Promise<ProctorExamItem[]> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');
    if (!user.isProctor()) throw new ForbiddenError('Only proctors can view exam list');

    const [exams, mine] = await Promise.all([
      this.exams.findOpenForProctor(),
      this.availability.findByUser(input.userId),
    ]);
    const byExamId = new Map(mine.map((a) => [a.examId, a.available]));
    return exams.map((exam) => ({
      exam,
      myAvailability: byExamId.get(exam.id) ?? null,
    }));
  }
}
