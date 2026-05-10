import type { ExamPeriod } from '../../../domain/entities/ExamPeriod.js';

export interface IExamPeriodRepository {
  findById(id: string): Promise<ExamPeriod | null>;
  findAll(): Promise<ExamPeriod[]>;
  save(period: ExamPeriod): Promise<void>;
  deleteById(id: string): Promise<void>;
}

export const IExamPeriodRepositoryToken = Symbol.for('IExamPeriodRepository');
