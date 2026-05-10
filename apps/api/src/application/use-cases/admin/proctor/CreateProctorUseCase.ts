import { inject, injectable } from 'tsyringe';
import { UserRole, type ProctorType } from '@app/shared';
import { User } from '../../../../domain/entities/User.js';
import { NationalId } from '../../../../domain/value-objects/NationalId.js';
import { DomainError } from '../../../../domain/errors/DomainError.js';
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
  IIdGeneratorToken,
  type IIdGenerator,
} from '../../../ports/services/IIdGenerator.js';

export interface CreateProctorInput {
  nationalId: string;
  firstName: string;
  lastName: string;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  proctorType: ProctorType;
}

// Default initial password literal per the spec: "1 עד 6" → "123456".
// Forced change on first login via mustChangePassword=true.
const INITIAL_PASSWORD = '123456';

@injectable()
export class CreateProctorUseCase {
  constructor(
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IPasswordHasherToken) private readonly hasher: IPasswordHasher,
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IIdGeneratorToken) private readonly ids: IIdGenerator,
  ) {}

  public async execute(input: CreateProctorInput): Promise<User> {
    const nationalId = NationalId.create(input.nationalId);
    const existing = await this.users.findByNationalId(nationalId);
    if (existing) {
      throw new DomainError(
        'CONFLICT',
        'A user with this national_id already exists',
        409,
      );
    }
    const now = this.clock.now();
    const user = new User({
      id: this.ids.next(),
      nationalId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone?.trim() ?? null,
      email: input.email?.trim().toLowerCase() ?? null,
      passwordHash: await this.hasher.hash(INITIAL_PASSWORD),
      role: UserRole.Proctor,
      proctorType: input.proctorType,
      mustChangePassword: true,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
    await this.users.save(user);
    return user;
  }
}
