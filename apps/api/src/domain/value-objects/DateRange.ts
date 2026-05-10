import { DomainError } from '../errors/DomainError.js';

export class DateRange {
  public readonly start: Date;
  public readonly end: Date;

  private constructor(start: Date, end: Date) {
    this.start = start;
    this.end = end;
  }

  public static create(start: Date, end: Date): DateRange {
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new DomainError('INVALID_DATE_RANGE', 'Invalid date in range');
    }
    if (start.getTime() > end.getTime()) {
      throw new DomainError('INVALID_DATE_RANGE', 'Start must be before or equal to end');
    }
    return new DateRange(start, end);
  }

  public contains(d: Date): boolean {
    const t = d.getTime();
    return t >= this.start.getTime() && t <= this.end.getTime();
  }
}
