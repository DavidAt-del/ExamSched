import { describe, it, expect } from 'vitest';
import { UserRole, ProctorType } from '@app/shared';
import { User } from '../../../src/domain/entities/User.js';
import { NationalId } from '../../../src/domain/value-objects/NationalId.js';
import {
  UserInactiveError,
  InvariantViolationError,
} from '../../../src/domain/errors/DomainError.js';

const baseProps = {
  id: '00000000-0000-0000-0000-000000000001',
  nationalId: NationalId.create('000000018'),
  firstName: 'Test',
  lastName: 'Proctor',
  email: 't@example.com',
  phone: null,
  passwordHash: 'hash',
  role: UserRole.Proctor,
  proctorType: ProctorType.Opener,
  mustChangePassword: true,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('User', () => {
  it('proctor users must have a proctor type', () => {
    expect(() => new User({ ...baseProps, proctorType: null })).toThrow(InvariantViolationError);
  });

  it('non-proctor users must not have proctor type', () => {
    expect(
      () =>
        new User({
          ...baseProps,
          role: UserRole.ExamStaff,
          proctorType: ProctorType.Opener,
        }),
    ).toThrow(InvariantViolationError);
  });

  it('changePassword clears must_change flag', () => {
    const u = new User(baseProps);
    const later = new Date(Date.now() + 1000);
    u.changePassword('newhash', later);
    expect(u.passwordHash).toBe('newhash');
    expect(u.mustChangePassword).toBe(false);
    expect(u.updatedAt).toEqual(later);
  });

  it('inactive user cannot log in', () => {
    const u = new User({ ...baseProps, active: false });
    expect(() => u.ensureCanLogin()).toThrow(UserInactiveError);
  });
});
