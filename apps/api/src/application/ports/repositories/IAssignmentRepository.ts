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
  /**
   * Replace every assignment under the given period atomically. Used by the
   * scheduler so a re-run is all-or-nothing.
   */
  replaceForPeriod(periodId: string, assignments: Assignment[]): Promise<void>;
  /** Find a specific classroom assignment within an exam, if it exists. */
  findByExamAndClassroom(examId: string, classroomIndex: number): Promise<Assignment | null>;
  saveOne(assignment: Assignment): Promise<void>;
}

export const IAssignmentRepositoryToken = Symbol.for('IAssignmentRepository');
