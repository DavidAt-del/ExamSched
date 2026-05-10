export interface AvailabilitySubmissionProps {
  id: string;
  userId: string;
  periodId: string;
  submittedAt: Date;
}

/**
 * Records the moment a proctor explicitly submitted ("שלח") their final
 * availability for an exam period. Distinct from the per-exam
 * `availabilities.submitted_at` which tracks the last toggle and changes on
 * every edit.
 */
export class AvailabilitySubmission {
  public readonly id: string;
  public readonly userId: string;
  public readonly periodId: string;
  public readonly submittedAt: Date;

  constructor(props: AvailabilitySubmissionProps) {
    this.id = props.id;
    this.userId = props.userId;
    this.periodId = props.periodId;
    this.submittedAt = props.submittedAt;
  }
}
