import { inject, injectable } from 'tsyringe';
import type { ProctorType } from '@app/shared';
import {
  ForbiddenError,
  NotFoundError,
} from '../../../../domain/errors/DomainError.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../../ports/repositories/IUserRepository.js';
import { IClockToken, type IClock } from '../../../ports/services/IClock.js';

export interface UpdateProctorInput {
  userId: string;
  patch: {
    firstName?: string | undefined;
    lastName?: string | undefined;
    phone?: string | null | undefined;
    email?: string | null | undefined;
    proctorType?: ProctorType | undefined;
  };
}

@injectable()
export class UpdateProctorUseCase {
  constructor(
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IClockToken) private readonly clock: IClock,
  ) {}

  public async execute(input: UpdateProctorInput): Promise<void> {
    const user = await this.users.findById(input.userId);
    if (!user) throw new NotFoundError('User');
    if (!user.isProctor()) {
      throw new ForbiddenError('Target user is not a proctor');
    }
    user.updateProfile(input.patch, this.clock.now());
    await this.users.save(user);
  }
}
