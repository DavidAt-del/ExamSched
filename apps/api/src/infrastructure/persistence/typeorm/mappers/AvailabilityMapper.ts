import { Availability } from '../../../../domain/entities/Availability.js';
import type { AvailabilityOrmEntity } from '../entities/AvailabilityOrmEntity.js';

export class AvailabilityMapper {
  public static toDomain(row: AvailabilityOrmEntity): Availability {
    return new Availability({
      id: row.id,
      userId: row.userId,
      examId: row.examId,
      available: row.available,
      submittedAt: row.submittedAt,
    });
  }

  public static toOrm(a: Availability, target: AvailabilityOrmEntity): AvailabilityOrmEntity {
    target.id = a.id;
    target.userId = a.userId;
    target.examId = a.examId;
    target.available = a.available;
    target.submittedAt = a.submittedAt;
    return target;
  }
}
