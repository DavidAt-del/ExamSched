import type { Assignment } from '../../../domain/entities/Assignment.js';

export interface IAssignmentRepository {
  findByExam(examId: string): Promise<Assignment[]>;
  findByPeriod(periodId: string): Promise<Assignment[]>;
  findByUser(userId: string): Promise<Assignment[]>;
  /**
   * Replace all assignments for a single exam atomically. Existing rows for
   * the exam are deleted; the new collection is inserted.
   */
  replaceForExam(examId: string, assignments: Assignment[]): Promise<void>;
  saveOne(assignment: Assignment): Promise<void>;
}

export const IAssignmentRepositoryToken = Symbol.for('IAssignmentRepository');
