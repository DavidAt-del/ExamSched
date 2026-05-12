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
  let audit: { log: ReturnType<typeof vi.fn> };
  let useCase: ResetProctorPasswordUseCase;

  function makeUsers() {
    return {
      findById: vi.fn(),
      findByNationalId: vi.fn(),
      findAllProctors: vi.fn(),
      findAllStaff: vi.fn(),
      save: vi.fn(),
      deactivate: vi.fn(),
    };
  }

  beforeEach(() => {
    users = makeUsers();
    hasher = { hash: vi.fn().mockResolvedValue('hashed'), verify: vi.fn() };
    audit = { log: vi.fn() };
    useCase = new ResetProctorPasswordUseCase(
      users,
      hasher,
      { now: () => fixedNow },
      audit,
    );
  });

  it('throws NotFound for unknown user', async () => {
    users.findById.mockResolvedValue(null);
    await expect(useCase.execute({ actorId: 'admin', userId: 'x' })).rejects.toBeInstanceOf(
      NotFoundError,
    );
    expect(audit.log).not.toHaveBeenCalled();
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
    await expect(useCase.execute({ actorId: 'admin', userId: 'u' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('resets to the fixed default password, forces a change, and audits', async () => {
    const user = mkProctor();
    users.findById.mockResolvedValue(user);
    const out = await useCase.execute({ actorId: 'admin', userId: 'u1' });
    expect(out.temporaryPassword).toBe('123456');
    expect(hasher.hash).toHaveBeenCalledWith('123456');
    expect(user.passwordHash).toBe('hashed');
    expect(user.mustChangePassword).toBe(true);
    expect(users.save).toHaveBeenCalledWith(user);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin',
        action: 'proctor.password_reset',
        targetType: 'user',
        targetId: 'u1',
      }),
    );
    // Sanity: the recorded payload must not include the plaintext password.
    const auditCall = audit.log.mock.calls[0]?.[0] as { payload?: unknown };
    expect(JSON.stringify(auditCall.payload ?? {})).not.toContain('123456');
  });
});
