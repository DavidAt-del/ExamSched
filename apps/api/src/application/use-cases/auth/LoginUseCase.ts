import { inject, injectable } from 'tsyringe';
import { NationalId } from '../../../domain/value-objects/NationalId.js';
import { InvalidCredentialsError } from '../../../domain/errors/DomainError.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../ports/repositories/IUserRepository.js';
import {
  IPasswordHasherToken,
  type IPasswordHasher,
} from '../../ports/services/IPasswordHasher.js';
import { ITokenServiceToken, type ITokenService } from '../../ports/services/ITokenService.js';
import type { User } from '../../../domain/entities/User.js';

export interface LoginInput {
  nationalId: string;
  password: string;
}

export interface LoginOutput {
  token: string;
  user: User;
}

@injectable()
export class LoginUseCase {
  constructor(
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IPasswordHasherToken) private readonly hasher: IPasswordHasher,
    @inject(ITokenServiceToken) private readonly tokens: ITokenService,
  ) {}

  public async execute(input: LoginInput): Promise<LoginOutput> {
    let nationalId: NationalId;
    try {
      nationalId = NationalId.create(input.nationalId);
    } catch {
      // Don't leak whether the ID is malformed vs unknown.
      throw new InvalidCredentialsError();
    }

    const user = await this.users.findByNationalId(nationalId);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    user.ensureCanLogin();

    const ok = await this.hasher.verify(input.password, user.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    const token = this.tokens.issue({
      sub: user.id,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });

    return { token, user };
  }
}
