import { inject, injectable } from 'tsyringe';
import {
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
} from '../../../../domain/errors/DomainError.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../../ports/repositories/IUserRepository.js';
import {
  IAssignmentRepositoryToken,
  type IAssignmentRepository,
} from '../../../ports/repositories/IAssignmentRepository.js';
import { IClockToken, type IClock } from '../../../ports/services/IClock.js';

export interface DeactivateProctorInput {
  userId: string;
}

@injectable()
export class DeactivateProctorUseCase {
  constructor(
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IAssignmentRepositoryToken)
    private readonly assignments: IAssignmentRepository,
    @inject(IClockToken) private readonly clock: IClock,
  ) {}

  public async execute(input: DeactivateProctorInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');
    if (!user.isProctor()) {
      throw new ForbiddenError('Only proctor users can be deactivated through this endpoint');
    }
    if (!user.active) return; // idempotent

    const now = this.clock.now();
    const blocking = await this.assignments.hasFutureForUser(input.userId, now);
    if (blocking) {
      throw new InvariantViolationError(
        'Proctor has future assignments; reassign or cancel them before deactivating',
      );
    }
    await this.users.deactivate(input.userId, now);
  }
}
