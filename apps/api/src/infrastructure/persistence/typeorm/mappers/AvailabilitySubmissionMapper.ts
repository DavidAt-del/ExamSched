import { AvailabilitySubmission } from '../../../../domain/entities/AvailabilitySubmission.js';
import type { AvailabilitySubmissionOrmEntity } from '../entities/AvailabilitySubmissionOrmEntity.js';

export class AvailabilitySubmissionMapper {
  public static toDomain(row: AvailabilitySubmissionOrmEntity): AvailabilitySubmission {
    return new AvailabilitySubmission({
      id: row.id,
      userId: row.userId,
      periodId: row.periodId,
      submittedAt: row.submittedAt,
    });
  }

  public static toOrm(
    s: AvailabilitySubmission,
    target: AvailabilitySubmissionOrmEntity,
  ): AvailabilitySubmissionOrmEntity {
    target.id = s.id;
    target.userId = s.userId;
    target.periodId = s.periodId;
    target.submittedAt = s.submittedAt;
    return target;
  }
}
