import { InvariantViolationError } from '../errors/DomainError.js';

export interface ExamProps {
  id: string;
  periodId: string;
  examDate: string; // ISO date YYYY-MM-DD (no time component)
  startTime: string; // HH:MM:SS
  endTime: string; // HH:MM:SS
  classroomCount: number;
}

export class Exam {
  public readonly id: string;
  public readonly periodId: string;
  public readonly examDate: string;
  public readonly startTime: string;
  public readonly endTime: string;
  public readonly classroomCount: number;

  constructor(props: ExamProps) {
    if (!Number.isInteger(props.classroomCount) || props.classroomCount <= 0) {
      throw new InvariantViolationError('Classroom count must be a positive integer');
    }
    if (props.startTime >= props.endTime) {
      throw new InvariantViolationError('Exam start time must be before end time');
    }
    this.id = props.id;
    this.periodId = props.periodId;
    this.examDate = props.examDate;
    this.startTime = props.startTime;
    this.endTime = props.endTime;
    this.classroomCount = props.classroomCount;
  }
}
