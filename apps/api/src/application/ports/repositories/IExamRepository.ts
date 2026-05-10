import type { Exam } from '../../../domain/entities/Exam.js';

export interface IExamRepository {
  findById(id: string): Promise<Exam | null>;
  findOpenForProctor(): Promise<Exam[]>;
  save(exam: Exam): Promise<void>;
}

export const IExamRepositoryToken = Symbol.for('IExamRepository');
