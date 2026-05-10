import type { Exam } from '../../../domain/entities/Exam.js';
import type { Proctor } from '../../../domain/entities/Proctor.js';
import type { Assignment } from '../../../domain/entities/Assignment.js';

export interface SchedulingInput {
  exam: Exam;
  availableProctors: Proctor[];
  /**
   * Running shift counts across the period so far. The engine reads it to
   * minimise variance and writes it back as it assigns each classroom.
   */
  shiftsByProctor: Map<string, number>;
  /** Factory the engine calls to mint each new Assignment id. */
  assignmentIds: () => string;
}

export interface SchedulingResult {
  assignments: Assignment[];
  /** Classroom indices the engine could not staff legally. */
  unfilledClassrooms: number[];
}

export interface ISchedulingEngine {
  schedule(input: SchedulingInput): SchedulingResult;
}

export const ISchedulingEngineToken = Symbol.for('ISchedulingEngine');
