import { inject, injectable } from 'tsyringe';
import {
  IAvailabilityRepositoryToken,
  type IAvailabilityRepository,
} from '../../ports/repositories/IAvailabilityRepository.js';

export interface ListExamAvailabilityInput {
  examId: string;
}

export interface ListExamAvailabilityOutput {
  availability: Array<{ userId: string; available: boolean }>;
}

@injectable()
export class ListExamAvailabilityUseCase {
  constructor(
    @inject(IAvailabilityRepositoryToken)
    private readonly availability: IAvailabilityRepository,
  ) {}

  public async execute(input: ListExamAvailabilityInput): Promise<ListExamAvailabilityOutput> {
    const rows = await this.availability.findByExam(input.examId);
    return {
      availability: rows.map((r) => ({ userId: r.userId, available: r.available })),
    };
  }
}
