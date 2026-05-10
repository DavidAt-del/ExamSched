import type { Exam } from '../../../domain/entities/Exam.js';
import type { Assignment } from '../../../domain/entities/Assignment.js';
import type { ExamPeriod } from '../../../domain/entities/ExamPeriod.js';
import type { User } from '../../../domain/entities/User.js';

export interface ScheduleExportInput {
  period: ExamPeriod;
  exams: Exam[];
  assignmentsByExam: Map<string, Assignment[]>;
  usersById: Map<string, User>;
}

export interface IScheduleExporter {
  /**
   * Render the schedule as an .xlsx workbook. Returns the binary as a Buffer
   * so the caller can stream it through any transport.
   */
  export(input: ScheduleExportInput): Promise<Buffer>;
}

export const IScheduleExporterToken = Symbol.for('IScheduleExporter');
