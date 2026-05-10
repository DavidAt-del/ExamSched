import type { Assignment } from '../../../domain/entities/Assignment.js';
import type { Exam } from '../../../domain/entities/Exam.js';
import type { ExamPeriod } from '../../../domain/entities/ExamPeriod.js';
import type { User } from '../../../domain/entities/User.js';
import type { EmailMessage } from './IEmailService.js';

export interface ScheduleEmailItem {
  assignment: Assignment;
  exam: Exam;
  /** The other proctor in the classroom; null when the user is on a solo opener slot. */
  partner: User | null;
}

export interface ScheduleEmailInput {
  user: User;
  period: ExamPeriod;
  items: ScheduleEmailItem[];
}

export interface IScheduleEmailBuilder {
  build(input: ScheduleEmailInput): EmailMessage;
}

export const IScheduleEmailBuilderToken = Symbol.for('IScheduleEmailBuilder');
