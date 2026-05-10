import type { User } from '../../../domain/entities/User.js';
import type { NationalId } from '../../../domain/value-objects/NationalId.js';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByNationalId(nationalId: NationalId): Promise<User | null>;
  findAllProctors(opts?: { includeInactive?: boolean }): Promise<User[]>;
  save(user: User): Promise<void>;
  /**
   * Soft-delete: mark a user as inactive. The row is retained for referential
   * integrity (assignments etc.) and audit trail.
   */
  deactivate(id: string, now: Date): Promise<void>;
}

export const IUserRepositoryToken = Symbol.for('IUserRepository');
