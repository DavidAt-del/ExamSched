import { UserRole, ProctorType } from '@app/shared';
import type { NationalId } from '../value-objects/NationalId.js';
import { UserInactiveError, InvariantViolationError } from '../errors/DomainError.js';

export interface UserProps {
  id: string;
  nationalId: NationalId;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  passwordHash: string;
  role: UserRole;
  proctorType: ProctorType | null;
  mustChangePassword: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  public readonly id: string;
  public readonly nationalId: NationalId;
  public firstName: string;
  public lastName: string;
  public email: string | null;
  public phone: string | null;
  public passwordHash: string;
  public readonly role: UserRole;
  public readonly proctorType: ProctorType | null;
  public mustChangePassword: boolean;
  public active: boolean;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(props: UserProps) {
    if (props.role === UserRole.Proctor && props.proctorType === null) {
      throw new InvariantViolationError('Proctor users must have a proctor type');
    }
    if (props.role !== UserRole.Proctor && props.proctorType !== null) {
      throw new InvariantViolationError('Non-proctor users cannot have a proctor type');
    }
    this.id = props.id;
    this.nationalId = props.nationalId;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.email = props.email;
    this.phone = props.phone;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.proctorType = props.proctorType;
    this.mustChangePassword = props.mustChangePassword;
    this.active = props.active;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public ensureCanLogin(): void {
    if (!this.active) {
      throw new UserInactiveError();
    }
  }

  public changePassword(newHash: string, now: Date): void {
    this.passwordHash = newHash;
    this.mustChangePassword = false;
    this.updatedAt = now;
  }

  public isProctor(): boolean {
    return this.role === UserRole.Proctor;
  }

  public isOpener(): boolean {
    return this.proctorType === ProctorType.Opener;
  }
}
