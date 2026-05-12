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
import { IClockToken, type IClock } from '../../../ports/services/IClock.js';
import { INITIAL_PASSWORD } from '../passwords.js';
import {
  IAuditLoggerToken,
  type IAuditLogger,
} from '../../../ports/services/IAuditLogger.js';

export interface ResetProctorPasswordInput {
  actorId: string;
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
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IAuditLoggerToken) private readonly audit: IAuditLogger,
  ) {}

  public async execute(input: ResetProctorPasswordInput): Promise<ResetProctorPasswordOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');
    if (!user.isProctor()) {
      throw new ForbiddenError('Only proctor passwords can be reset through this endpoint');
    }
    // Spec §10.5: reset to the fixed default password. `mustChangePassword` is
    // set inside resetPassword(), so the user is forced to change it on
    // next sign-in.
    const hash = await this.hasher.hash(INITIAL_PASSWORD);
    user.resetPassword(hash, this.clock.now());
    await this.users.save(user);
    await this.audit.log({
      actorId: input.actorId,
      action: 'proctor.password_reset',
      targetType: 'user',
      targetId: input.userId,
    });
    return { temporaryPassword: INITIAL_PASSWORD };
  }
}
