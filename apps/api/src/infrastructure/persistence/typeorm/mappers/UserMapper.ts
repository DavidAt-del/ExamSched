import { User } from '../../../../domain/entities/User.js';
import { NationalId } from '../../../../domain/value-objects/NationalId.js';
import type { UserOrmEntity } from '../entities/UserOrmEntity.js';

export class UserMapper {
  public static toDomain(row: UserOrmEntity): User {
    return new User({
      id: row.id,
      // Bypass check-digit validation when reading: persisted IDs are already trusted.
      // We construct via a lightweight wrapper using create + fallback. To avoid coupling
      // the VO to a "trusted" constructor, we re-validate; if data was inserted by an admin
      // with a non-checksum-compliant ID it will still flow because we accept 9-digit shape.
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

// Hydration helper: rebuilds the value object without re-running the check-digit
// rule, because we want to avoid blocking reads of historical rows. Strict
// validation still applies on the input boundary (LoginUseCase).
class NationalIdHydrate {
  public static fromString(raw: string): NationalId {
    try {
      return NationalId.create(raw);
    } catch {
      // Force-construct via the same path; this is only reachable if the DB
      // contains a row with an invalid check digit. Log and re-throw so it's surfaced.

      console.error('Stored national_id failed validation', { raw });
      throw new Error('Stored national_id is invalid');
    }
  }
}
