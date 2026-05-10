import { inject, injectable } from 'tsyringe';
import type { User } from '../../../../domain/entities/User.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../../ports/repositories/IUserRepository.js';

export interface ListProctorsInput {
  includeInactive?: boolean;
}

@injectable()
export class ListProctorsUseCase {
  constructor(@inject(IUserRepositoryToken) private readonly users: IUserRepository) {}

  public execute(input: ListProctorsInput = {}): Promise<User[]> {
    return this.users.findAllProctors({ includeInactive: input.includeInactive ?? false });
  }
}
