import { User } from '../../../../domain/entities/User.js';
import { NationalId } from '../../../../domain/value-objects/NationalId.js';
import { InvariantViolationError } from '../../../../domain/errors/DomainError.js';
import type { UserOrmEntity } from '../entities/UserOrmEntity.js';

export class UserMapper {
  public static toDomain(row: UserOrmEntity): User {
    return new User({
      id: row.id,
      nationalId: NationalIdHydrate.fromString(row.nationalId),
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      passwordHash: row.passwordHash,
      role: row.role,
      proctorType: row.proctorType,
      mustChangePassword: row.mustChangePassword,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toOrm(user: User, target: UserOrmEntity): UserOrmEntity {
    target.id = user.id;
    target.nationalId = user.nationalId.toString();
    target.firstName = user.firstName;
    target.lastName = user.lastName;
    target.email = user.email;
    target.phone = user.phone;
    target.passwordHash = user.passwordHash;
    target.role = user.role;
    target.proctorType = user.proctorType;
    target.mustChangePassword = user.mustChangePassword;
    target.active = user.active;
    target.createdAt = user.createdAt;
    target.updatedAt = user.updatedAt;
    return target;
  }
}

// Hydrates a NationalId from a persisted row. Persistence is treated as a
// trusted source for shape, but we still re-run the check-digit rule and
// fail fast if a stored row is invalid — surfaced as a typed DomainError so
// the central handler maps it to a structured 422 response. The raw ID is
// never logged to avoid leaking PII.
class NationalIdHydrate {
  public static fromString(raw: string): NationalId {
    try {
      return NationalId.create(raw);
    } catch {
      throw new InvariantViolationError(
        'Persisted national_id failed validation; refusing to hydrate user',
      );
    }
  }
}
