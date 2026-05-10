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
  // Mutable through `updateProctorType` only; the role itself stays immutable.
  private _proctorType: ProctorType | null;
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
    this._proctorType = props.proctorType;
    this.mustChangePassword = props.mustChangePassword;
    this.active = props.active;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public get proctorType(): ProctorType | null {
    return this._proctorType;
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

  public resetPassword(newHash: string, now: Date): void {
    this.passwordHash = newHash;
    this.mustChangePassword = true;
    this.updatedAt = now;
  }

  public updateProfile(
    patch: {
      firstName?: string | undefined;
      lastName?: string | undefined;
      phone?: string | null | undefined;
      email?: string | null | undefined;
      proctorType?: ProctorType | null | undefined;
    },
    now: Date,
  ): void {
    if (patch.firstName !== undefined) this.firstName = patch.firstName.trim();
    if (patch.lastName !== undefined) this.lastName = patch.lastName.trim();
    if (patch.phone !== undefined) this.phone = patch.phone?.trim() ?? null;
    if (patch.email !== undefined) this.email = patch.email?.trim().toLowerCase() ?? null;
    if (patch.proctorType !== undefined) {
      if (this.role !== UserRole.Proctor) {
        throw new InvariantViolationError(
          'Only proctor users can have a proctor type',
        );
      }
      if (patch.proctorType === null) {
        throw new InvariantViolationError('Proctor users must have a proctor type');
      }
      this._proctorType = patch.proctorType;
    }
    this.updatedAt = now;
  }

  public deactivate(now: Date): void {
    this.active = false;
    this.updatedAt = now;
  }

  public isProctor(): boolean {
    return this.role === UserRole.Proctor;
  }

  public isOpener(): boolean {
    return this._proctorType === ProctorType.Opener;
  }
}
