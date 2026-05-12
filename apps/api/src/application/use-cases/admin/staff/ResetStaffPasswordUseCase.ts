import { inject, injectable } from 'tsyringe';
import { UserRole } from '@app/shared';
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
import {
  IAuditLoggerToken,
  type IAuditLogger,
} from '../../../ports/services/IAuditLogger.js';
import { INITIAL_PASSWORD } from '../passwords.js';

export interface ResetStaffPasswordInput {
  actorId: string;
  userId: string;
}

export interface ResetStaffPasswordOutput {
  // Returned only to the calling admin; never persist or log.
  temporaryPassword: string;
}

@injectable()
export class ResetStaffPasswordUseCase {
  constructor(
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IPasswordHasherToken) private readonly hasher: IPasswordHasher,
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IAuditLoggerToken) private readonly audit: IAuditLogger,
  ) {}

  public async execute(input: ResetStaffPasswordInput): Promise<ResetStaffPasswordOutput> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');
    if (user.role !== UserRole.ExamStaff) {
      throw new ForbiddenError(
        'Only exam-staff passwords can be reset through this endpoint',
      );
    }
    // Spec §10.5: reset to the fixed default password.
    const hash = await this.hasher.hash(INITIAL_PASSWORD);
    user.resetPassword(hash, this.clock.now());
    await this.users.save(user);
    await this.audit.log({
      actorId: input.actorId,
      action: 'staff.password_reset',
      targetType: 'user',
      targetId: input.userId,
    });
    return { temporaryPassword: INITIAL_PASSWORD };
  }
}
