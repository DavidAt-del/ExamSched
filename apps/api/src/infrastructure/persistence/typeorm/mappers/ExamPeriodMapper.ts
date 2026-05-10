import { ExamPeriod } from '../../../../domain/entities/ExamPeriod.js';
import type { ExamPeriodOrmEntity } from '../entities/ExamPeriodOrmEntity.js';

export class ExamPeriodMapper {
  public static toDomain(row: ExamPeriodOrmEntity): ExamPeriod {
    return new ExamPeriod({
      id: row.id,
      name: row.name,
      deadline: row.deadline,
      status: row.status,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  public static toOrm(period: ExamPeriod, target: ExamPeriodOrmEntity): ExamPeriodOrmEntity {
    target.id = period.id;
    target.name = period.name;
    target.deadline = period.deadline;
    target.status = period.status;
    target.createdBy = period.createdBy;
    target.createdAt = period.createdAt;
    target.updatedAt = period.updatedAt;
    return target;
  }
}
