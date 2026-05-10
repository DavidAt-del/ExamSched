export interface AvailabilityProps {
  id: string;
  userId: string;
  examId: string;
  available: boolean;
  submittedAt: Date;
}

export class Availability {
  public readonly id: string;
  public readonly userId: string;
  public readonly examId: string;
  public available: boolean;
  public submittedAt: Date;

  constructor(props: AvailabilityProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.examId = props.examId;
    this.available = props.available;
    this.submittedAt = props.submittedAt;
  }

  public update(available: boolean, now: Date): void {
    this.available = available;
    this.submittedAt = now;
  }
}
