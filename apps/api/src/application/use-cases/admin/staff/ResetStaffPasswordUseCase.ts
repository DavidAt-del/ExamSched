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
import {
  ITempPasswordGeneratorToken,
  type ITempPasswordGenerator,
} from '../../../ports/services/ITempPasswordGenerator.js';
import { IClockToken, type IClock } from '../../../ports/services/IClock.js';
import {
  IAuditLoggerToken,
  type IAuditLogger,
} from '../../../ports/services/IAuditLogger.js';

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
    @inject(ITempPasswordGeneratorToken)
    private readonly tempPasswords: ITempPasswordGenerator,
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
    const temp = this.tempPasswords.next(6);
    const hash = await this.hasher.hash(temp);
    user.resetPassword(hash, this.clock.now());
    await this.users.save(user);
    // Never log the temporary password.
    await this.audit.log({
      actorId: input.actorId,
      action: 'staff.password_reset',
      targetType: 'user',
      targetId: input.userId,
    });
    return { temporaryPassword: temp };
  }
}
