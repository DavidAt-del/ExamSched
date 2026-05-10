import { InvariantViolationError } from '../errors/DomainError.js';

export interface AssignmentProps {
  id: string;
  examId: string;
  classroomIndex: number;
  openerUserId: string;
  regularUserId: string | null;
  manualOverride: boolean;
  notes: string | null;
}

export class Assignment {
  public readonly id: string;
  public readonly examId: string;
  public readonly classroomIndex: number;
  public openerUserId: string;
  public regularUserId: string | null;
  public manualOverride: boolean;
  public notes: string | null;

  constructor(props: AssignmentProps) {
    if (!props.openerUserId) {
      throw new InvariantViolationError('Assignment must have an opener');
    }
    this.id = props.id;
    this.examId = props.examId;
    this.classroomIndex = props.classroomIndex;
    this.openerUserId = props.openerUserId;
    this.regularUserId = props.regularUserId;
    this.manualOverride = props.manualOverride;
    this.notes = props.notes;
  }
}
