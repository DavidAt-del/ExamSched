import type { Assignment } from '../../../domain/entities/Assignment.js';

export interface IAssignmentRepository {
  findByExam(examId: string): Promise<Assignment[]>;
  findByPeriod(periodId: string): Promise<Assignment[]>;
  findByUser(userId: string): Promise<Assignment[]>;
  /**
   * True iff the user is currently assigned to any exam taking place on or
   * after `fromDate` (compared as a calendar date, ignoring time of day).
   */
  hasFutureForUser(userId: string, fromDate: Date): Promise<boolean>;
  /**
   * Replace all assignments for a single exam atomically. Existing rows for
   * the exam are deleted; the new collection is inserted.
   */
  replaceForExam(examId: string, assignments: Assignment[]): Promise<void>;
  saveOne(assignment: Assignment): Promise<void>;
}

export const IAssignmentRepositoryToken = Symbol.for('IAssignmentRepository');
