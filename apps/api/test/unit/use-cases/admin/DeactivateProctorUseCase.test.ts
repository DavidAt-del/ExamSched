import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProctorType, UserRole } from '@app/shared';
import { DeactivateProctorUseCase } from '../../../../src/application/use-cases/admin/proctor/DeactivateProctorUseCase.js';
import { User } from '../../../../src/domain/entities/User.js';
import { NationalId } from '../../../../src/domain/value-objects/NationalId.js';
import {
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
} from '../../../../src/domain/errors/DomainError.js';

const fixedNow = new Date('2026-05-10T10:00:00Z');

function mkProctor(overrides: { active?: boolean } = {}): User {
  return new User({
    id: 'u1',
    nationalId: NationalId.create('000000018'),
    firstName: 'Dana',
    lastName: 'Cohen',
    email: null,
    phone: null,
    passwordHash: 'h',
    role: UserRole.Proctor,
    proctorType: ProctorType.Opener,
    mustChangePassword: false,
    active: overrides.active ?? true,
    createdAt: fixedNow,
    updatedAt: fixedNow,
  });
}

describe('DeactivateProctorUseCase', () => {
  let users: {
    findById: ReturnType<typeof vi.fn>;
    findByNationalId: ReturnType<typeof vi.fn>;
    findAllProctors: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    deactivate: ReturnType<typeof vi.fn>;
  };
  let assignments: {
    findByExam: ReturnType<typeof vi.fn>;
    findByPeriod: ReturnType<typeof vi.fn>;
    findByUser: ReturnType<typeof vi.fn>;
    hasFutureForUser: ReturnType<typeof vi.fn>;
    replaceForExam: ReturnType<typeof vi.fn>;
    saveOne: ReturnType<typeof vi.fn>;
  };
  let useCase: DeactivateProctorUseCase;

  beforeEach(() => {
    users = {
      findById: vi.fn(),
      findByNationalId: vi.fn(),
      findAllProctors: vi.fn(),
      save: vi.fn(),
      deactivate: vi.fn(),
    };
    assignments = {
      findByExam: vi.fn(),
      findByPeriod: vi.fn(),
      findByUser: vi.fn(),
      hasFutureForUser: vi.fn(),
      replaceForExam: vi.fn(),
      saveOne: vi.fn(),
    };
    useCase = new DeactivateProctorUseCase(users, assignments, { now: () => fixedNow });
  });

  it('rejects unknown user with NotFound', async () => {
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
        role: UserRole.ExamStaff,
        proctorType: null,
        mustChangePassword: false,
        active: true,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      }),
    );
    await expect(useCase.execute({ userId: 'u' })).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('is idempotent when already inactive', async () => {
    users.findById.mockResolvedValue(mkProctor({ active: false }));
    await useCase.execute({ userId: 'u1' });
    expect(assignments.hasFutureForUser).not.toHaveBeenCalled();
    expect(users.deactivate).not.toHaveBeenCalled();
  });

  it('blocks when proctor has future assignments', async () => {
    users.findById.mockResolvedValue(mkProctor());
    assignments.hasFutureForUser.mockResolvedValue(true);
    await expect(useCase.execute({ userId: 'u1' })).rejects.toBeInstanceOf(
      InvariantViolationError,
    );
    expect(users.deactivate).not.toHaveBeenCalled();
  });

  it('deactivates when no future assignments', async () => {
    users.findById.mockResolvedValue(mkProctor());
    assignments.hasFutureForUser.mockResolvedValue(false);
    await useCase.execute({ userId: 'u1' });
    expect(users.deactivate).toHaveBeenCalledWith('u1', fixedNow);
  });
});
