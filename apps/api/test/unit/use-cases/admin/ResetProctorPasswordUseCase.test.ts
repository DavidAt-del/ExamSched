import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProctorType, UserRole } from '@app/shared';
import { ResetProctorPasswordUseCase } from '../../../../src/application/use-cases/admin/proctor/ResetProctorPasswordUseCase.js';
import { User } from '../../../../src/domain/entities/User.js';
import { NationalId } from '../../../../src/domain/value-objects/NationalId.js';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');

function mkProctor(): User {
  return new User({
    id: 'u1',
    nationalId: NationalId.create('000000018'),
    firstName: 'D',
    lastName: 'C',
    email: null,
    phone: null,
    passwordHash: 'old-hash',
    role: UserRole.Proctor,
    proctorType: ProctorType.Opener,
    mustChangePassword: false,
    active: true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

describe('ResetProctorPasswordUseCase', () => {
  let users: ReturnType<typeof makeUsers>;
  let hasher: { hash: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let temp: { next: ReturnType<typeof vi.fn> };
  let useCase: ResetProctorPasswordUseCase;

  function makeUsers() {
    return {
      findById: vi.fn(),
      findByNationalId: vi.fn(),
      findAllProctors: vi.fn(),
      save: vi.fn(),
      deactivate: vi.fn(),
    };
  }

  beforeEach(() => {
    users = makeUsers();
    hasher = { hash: vi.fn().mockResolvedValue('hashed'), verify: vi.fn() };
    temp = { next: vi.fn().mockReturnValue('AB23CD') };
    useCase = new ResetProctorPasswordUseCase(users, hasher, temp, {
      now: () => fixedNow,
    });
  });

  it('throws NotFound for unknown user', async () => {
    users.findById.mockResolvedValue(null);
    await expect(useCase.execute({ userId: 'x' })).rejects.toBeInstanceOf(NotFoundError);
  });

  it('rejects non-proctor users', async () => {
    users.findById.mockResolvedValue(
      new User({
        id: 'u',
        nationalId: NationalId.create('000000018'),
        firstName: 'A',
        lastName: 'B',
        email: null,
        phone: null,
        passwordHash: 'h',
        role: UserRole.Admin,
        proctorType: null,
        mustChangePassword: false,
        active: true,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      }),
    );
    await expect(useCase.execute({ userId: 'u' })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('returns the plaintext temporary password and forces a change on next login', async () => {
    const user = mkProctor();
    users.findById.mockResolvedValue(user);
    const out = await useCase.execute({ userId: 'u1' });
    expect(out.temporaryPassword).toBe('AB23CD');
    expect(temp.next).toHaveBeenCalledWith(6);
    expect(hasher.hash).toHaveBeenCalledWith('AB23CD');
    expect(user.passwordHash).toBe('hashed');
    expect(user.mustChangePassword).toBe(true);
    expect(users.save).toHaveBeenCalledWith(user);
  });
});
