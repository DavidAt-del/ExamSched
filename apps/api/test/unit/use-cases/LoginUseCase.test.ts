import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRole, ProctorType } from '@app/shared';
import { LoginUseCase } from '../../../src/application/use-cases/auth/LoginUseCase.js';
import { User } from '../../../src/domain/entities/User.js';
import { NationalId } from '../../../src/domain/value-objects/NationalId.js';
import {
  InvalidCredentialsError,
  UserInactiveError,
} from '../../../src/domain/errors/DomainError.js';
import type { IUserRepository } from '../../../src/application/ports/repositories/IUserRepository.js';
import type { IPasswordHasher } from '../../../src/application/ports/services/IPasswordHasher.js';
import type { ITokenService } from '../../../src/application/ports/services/ITokenService.js';

const validNationalId = '000000018';

function mkUser(overrides: Partial<ConstructorParameters<typeof User>[0]> = {}) {
  return new User({
    id: 'user-1',
    nationalId: NationalId.create(validNationalId),
    firstName: 'Dana',
    lastName: 'Cohen',
    email: null,
    phone: null,
    passwordHash: 'hashed',
    role: UserRole.Proctor,
    proctorType: ProctorType.Opener,
    mustChangePassword: true,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('LoginUseCase', () => {
  let users: IUserRepository;
  let hasher: IPasswordHasher;
  let tokens: ITokenService;
  let useCase: LoginUseCase;

  beforeEach(() => {
    users = {
      findById: vi.fn(),
      findByNationalId: vi.fn(),
      findAllProctors: vi.fn(),
      findAllStaff: vi.fn(),
      save: vi.fn(),
      deactivate: vi.fn(),
    };
    hasher = {
      hash: vi.fn(),
      verify: vi.fn(),
    };
    tokens = {
      issue: vi.fn().mockReturnValue('jwt-token'),
      verify: vi.fn(),
    };
    useCase = new LoginUseCase(users, hasher, tokens);
  });

  it('rejects malformed national id with generic invalid creds', async () => {
    await expect(
      useCase.execute({ nationalId: 'not-a-id', password: '123456' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects unknown user with generic invalid creds', async () => {
    (users.findByNationalId as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(
      useCase.execute({ nationalId: validNationalId, password: '123456' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects inactive user', async () => {
    (users.findByNationalId as ReturnType<typeof vi.fn>).mockResolvedValue(
      mkUser({ active: false }),
    );
    await expect(
      useCase.execute({ nationalId: validNationalId, password: '123456' }),
    ).rejects.toBeInstanceOf(UserInactiveError);
  });

  it('rejects bad password', async () => {
    (users.findByNationalId as ReturnType<typeof vi.fn>).mockResolvedValue(mkUser());
    (hasher.verify as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    await expect(
      useCase.execute({ nationalId: validNationalId, password: 'wrong' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('issues token on success', async () => {
    const u = mkUser();
    (users.findByNationalId as ReturnType<typeof vi.fn>).mockResolvedValue(u);
    (hasher.verify as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const out = await useCase.execute({ nationalId: validNationalId, password: '123456' });
    expect(out.token).toBe('jwt-token');
    expect(out.user).toBe(u);
    expect(tokens.issue).toHaveBeenCalledWith({
      sub: 'user-1',
      role: UserRole.Proctor,
      mustChangePassword: true,
    });
  });
});
