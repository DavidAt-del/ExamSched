import { ExamPeriodStatus } from '@app/shared';
import { InvariantViolationError } from '../errors/DomainError.js';

export interface ExamPeriodProps {
  id: string;
  name: string;
  deadline: Date;
  status: ExamPeriodStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ExamPeriod {
  public readonly id: string;
  public name: string;
  public deadline: Date;
  public status: ExamPeriodStatus;
  public readonly createdBy: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: ExamPeriodProps) {
    this.id = props.id;
    this.name = props.name;
    this.deadline = props.deadline;
    this.status = props.status;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public isAcceptingAvailability(now: Date): boolean {
    return this.status === ExamPeriodStatus.Open && now.getTime() <= this.deadline.getTime();
  }

  public ensureAcceptingAvailability(now: Date): void {
    if (!this.isAcceptingAvailability(now)) {
      throw new InvariantViolationError('Exam period is not accepting availability submissions');
    }
  }
}
