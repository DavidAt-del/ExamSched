import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProctorType, UserRole } from '@app/shared';
import { CreateProctorUseCase } from '../../../../src/application/use-cases/admin/proctor/CreateProctorUseCase.js';
import { User } from '../../../../src/domain/entities/User.js';
import { NationalId } from '../../../../src/domain/value-objects/NationalId.js';
import { DomainError } from '../../../../src/domain/errors/DomainError.js';

describe('CreateProctorUseCase', () => {
  const validId = '000000018';
  const fixedNow = new Date('2026-05-10T10:00:00Z');

  let users: ReturnType<typeof makeUsers>;
  let hasher: ReturnType<typeof makeHasher>;
  let useCase: CreateProctorUseCase;

  function makeUsers() {
    return {
      findById: vi.fn(),
      findByNationalId: vi.fn(),
      findAllProctors: vi.fn(),
      save: vi.fn(),
      deactivate: vi.fn(),
    };
  }
  function makeHasher() {
    return { hash: vi.fn().mockResolvedValue('hashed'), verify: vi.fn() };
  }

  beforeEach(() => {
    users = makeUsers();
    hasher = makeHasher();
    useCase = new CreateProctorUseCase(
      users,
      hasher,
      { now: () => fixedNow },
      { next: () => 'new-uuid' },
    );
  });

  it('rejects an invalid national id', async () => {
    await expect(
      useCase.execute({
        nationalId: 'not-a-id',
        firstName: 'A',
        lastName: 'B',
        proctorType: ProctorType.Opener,
      }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(users.save).not.toHaveBeenCalled();
  });

  it('rejects when national id already exists', async () => {
    users.findByNationalId.mockResolvedValue(
      new User({
        id: 'u-other',
        nationalId: NationalId.create(validId),
        firstName: 'Other',
        lastName: 'Existing',
        email: null,
        phone: null,
        passwordHash: 'h',
        role: UserRole.Proctor,
        proctorType: ProctorType.Regular,
        mustChangePassword: false,
        active: true,
        createdAt: fixedNow,
        updatedAt: fixedNow,
      }),
    );
    await expect(
      useCase.execute({
        nationalId: validId,
        firstName: 'A',
        lastName: 'B',
        proctorType: ProctorType.Opener,
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT', status: 409 });
  });

  it('creates a proctor with default password "123456" and mustChangePassword=true', async () => {
    users.findByNationalId.mockResolvedValue(null);
    const result = await useCase.execute({
      nationalId: validId,
      firstName: 'Dana ',
      lastName: ' Cohen ',
      email: 'DANA@Example.com',
      phone: ' 050-1234567 ',
      proctorType: ProctorType.Opener,
    });
    expect(hasher.hash).toHaveBeenCalledWith('123456');
    expect(result.firstName).toBe('Dana');
    expect(result.lastName).toBe('Cohen');
    expect(result.email).toBe('dana@example.com');
    expect(result.phone).toBe('050-1234567');
    expect(result.role).toBe(UserRole.Proctor);
    expect(result.proctorType).toBe(ProctorType.Opener);
    expect(result.mustChangePassword).toBe(true);
    expect(result.active).toBe(true);
    expect(users.save).toHaveBeenCalledTimes(1);
  });
});
