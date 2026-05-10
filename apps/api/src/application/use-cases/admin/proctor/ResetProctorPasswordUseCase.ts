import { inject, injectable } from 'tsyringe';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../../domain/errors/DomainError.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../../ports/repositories/IUserRepository.js';
import {
  IPasswordHasherToken,
  type IPasswordHasher,
} from '../../../ports/services/IPasswordHasher.js';
import {
  ITempPasswordGeneratorToken,
  type ITempPasswordGenerator,
} from '../../../ports/services/ITempPasswordGenerator.js';
import { IClockToken, type IClock } from '../../../ports/services/IClock.js';

export interface ResetProctorPasswordInput {
  userId: string;
}

export interface ResetProctorPasswordOutput {
  // Returned only to the calling admin; never persist or log.
  temporaryPassword: string;
}

@injectable()
export class ResetProctorPasswordUseCase {
  constructor(
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IPasswordHasherToken) private readonly hasher: IPasswordHasher,
    @inject(ITempPasswordGeneratorToken)
    private readonly tempPasswords: ITempPasswordGenerator,
    @inject(IClockToken) private readonly clock: IClock,
  ) {}

  public async execute(input: ResetProctorPasswordInput): Promise<ResetProctorPasswordOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');
    if (!user.isProctor()) {
      throw new ForbiddenError('Only proctor passwords can be reset through this endpoint');
    }
    const temp = this.tempPasswords.next(6);
    const hash = await this.hasher.hash(temp);
    user.resetPassword(hash, this.clock.now());
    await this.users.save(user);
    return { temporaryPassword: temp };
  }
}
