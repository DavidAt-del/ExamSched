import type { ExamPeriod } from '../../../domain/entities/ExamPeriod.js';

export interface IExamPeriodRepository {
  findById(id: string): Promise<ExamPeriod | null>;
  save(period: ExamPeriod): Promise<void>;
}

export const IExamPeriodRepositoryToken = Symbol.for('IExamPeriodRepository');
