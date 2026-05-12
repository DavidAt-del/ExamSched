import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProctorType, UserRole } from '@app/shared';
import { ResetStaffPasswordUseCase } from '../../../../../src/application/use-cases/admin/staff/ResetStaffPasswordUseCase.js';
import { User } from '../../../../../src/domain/entities/User.js';
import { NationalId } from '../../../../../src/domain/value-objects/NationalId.js';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');

function mkUser(role: UserRole, opts: { active?: boolean } = {}): User {
  return new User({
    id: 'u1',
    nationalId: NationalId.create('000000018'),
    firstName: 'A',
    lastName: 'B',
    email: 'a@example.com',
    phone: null,
    passwordHash: 'old-hash',
    role,
    proctorType: role === UserRole.Proctor ? ProctorType.Opener : null,
    mustChangePassword: false,
    active: opts.active ?? true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

describe('ResetStaffPasswordUseCase', () => {
  let users: ReturnType<typeof makeUsers>;
  let hasher: { hash: ReturnType<typeof vi.fn>; verify: ReturnType<typeof vi.fn> };
  let audit: { log: ReturnType<typeof vi.fn> };
  let useCase: ResetStaffPasswordUseCase;

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
    useCase = new ResetStaffPasswordUseCase(
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

  it('rejects when target user is not exam-staff (proctor)', async () => {
    users.findById.mockResolvedValue(mkUser(UserRole.Proctor));
    await expect(useCase.execute({ actorId: 'admin', userId: 'u1' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    expect(audit.log).not.toHaveBeenCalled();
  });

  it('rejects when target user is admin (separate flow)', async () => {
    users.findById.mockResolvedValue(mkUser(UserRole.Admin));
    await expect(useCase.execute({ actorId: 'admin', userId: 'u1' })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it('resets to the fixed default password and audits the reset', async () => {
    const user = mkUser(UserRole.ExamStaff);
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
        action: 'staff.password_reset',
        targetType: 'user',
        targetId: 'u1',
      }),
    );
    const auditCall = audit.log.mock.calls[0]?.[0] as { payload?: unknown };
    expect(JSON.stringify(auditCall.payload ?? {})).not.toContain('123456');
  });
});
