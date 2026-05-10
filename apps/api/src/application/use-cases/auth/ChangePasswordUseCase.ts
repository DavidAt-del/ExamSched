import { inject, injectable } from 'tsyringe';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../ports/repositories/IUserRepository.js';
import {
  IPasswordHasherToken,
  type IPasswordHasher,
} from '../../ports/services/IPasswordHasher.js';
import { IClockToken, type IClock } from '../../ports/services/IClock.js';
import { InvalidCredentialsError, NotFoundError } from '../../../domain/errors/DomainError.js';

export interface ChangePasswordInput {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

@injectable()
export class ChangePasswordUseCase {
  constructor(
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IPasswordHasherToken) private readonly hasher: IPasswordHasher,
    @inject(IClockToken) private readonly clock: IClock,
  ) {}

  public async execute(input: ChangePasswordInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');

    const ok = await this.hasher.verify(input.currentPassword, user.passwordHash);
    if (!ok) throw new InvalidCredentialsError();

    const newHash = await this.hasher.hash(input.newPassword);
    user.changePassword(newHash, this.clock.now());
    await this.users.save(user);
  }
}
