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
  private _status: ExamPeriodStatus;
  public readonly createdBy: string;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ExamPeriodProps) {
    this.id = props.id;
    this.name = props.name;
    this.deadline = props.deadline;
    this._status = props.status;
    this.createdBy = props.createdBy;
    this.createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  public get status(): ExamPeriodStatus {
    return this._status;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Transition to Closed. Accepts Open → Closed (idempotent on Closed).
   * Throws if already Scheduled or Sent.
   */
  public close(now: Date): void {
    if (this._status === ExamPeriodStatus.Closed) return; // idempotent
    if (
      this._status === ExamPeriodStatus.Scheduled ||
      this._status === ExamPeriodStatus.Sent
    ) {
      throw new InvariantViolationError(
        `Cannot close a period in status '${this._status}'; only Open periods can be closed`,
      );
    }
    this._status = ExamPeriodStatus.Closed;
    this._updatedAt = now;
  }

  /**
   * Transition to Scheduled. Accepts Open | Closed | Scheduled (re-run allowed).
   * Throws if already Sent.
   */
  public markScheduled(now: Date): void {
    if (this._status === ExamPeriodStatus.Sent) {
      throw new InvariantViolationError(
        `Cannot mark a period as scheduled when it is already '${this._status}'`,
      );
    }
    this._status = ExamPeriodStatus.Scheduled;
    this._updatedAt = now;
  }

  /**
   * Transition to Sent. Accepts only Scheduled.
   */
  public markSent(now: Date): void {
    if (this._status !== ExamPeriodStatus.Scheduled) {
      throw new InvariantViolationError(
        `Cannot send a period in status '${this._status}'; period must be in Scheduled status first`,
      );
    }
    this._status = ExamPeriodStatus.Sent;
    this._updatedAt = now;
  }

  public isAcceptingAvailability(now: Date): boolean {
    return this._status === ExamPeriodStatus.Open && now.getTime() <= this.deadline.getTime();
  }

  public ensureAcceptingAvailability(now: Date): void {
    if (!this.isAcceptingAvailability(now)) {
      throw new InvariantViolationError('Exam period is not accepting availability submissions');
    }
  }
}
