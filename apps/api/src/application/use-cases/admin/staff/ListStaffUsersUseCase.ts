import { inject, injectable } from 'tsyringe';
import type { User } from '../../../../domain/entities/User.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../../ports/repositories/IUserRepository.js';

@injectable()
export class ListStaffUsersUseCase {
  constructor(@inject(IUserRepositoryToken) private readonly users: IUserRepository) {}

  public execute(opts: { includeInactive?: boolean } = {}): Promise<User[]> {
    return this.users.findAllStaff({ includeInactive: opts.includeInactive ?? true });
  }
}
