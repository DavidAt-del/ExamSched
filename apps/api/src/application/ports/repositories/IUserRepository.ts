import type { User } from '../../../domain/entities/User.js';
import type { NationalId } from '../../../domain/value-objects/NationalId.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByNationalId(nationalId: NationalId): Promise<User | null>;
  save(user: User): Promise<void>;
}

export const IUserRepositoryToken = Symbol.for('IUserRepository');
