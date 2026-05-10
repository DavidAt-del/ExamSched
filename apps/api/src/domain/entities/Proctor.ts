import type { ProctorType } from '@app/shared';

// Lightweight read-model used by the scheduling domain service. The persistence
// store maps a User row (role=proctor) into this view.
export interface ProctorProps {
  userId: string;
  proctorType: ProctorType;
  firstName: string;
  lastName: string;
}

export class Proctor {
  public readonly userId: string;
  public readonly proctorType: ProctorType;
  public readonly firstName: string;
  public readonly lastName: string;

  constructor(props: ProctorProps) {
    this.userId = props.userId;
    this.proctorType = props.proctorType;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
  }
}
