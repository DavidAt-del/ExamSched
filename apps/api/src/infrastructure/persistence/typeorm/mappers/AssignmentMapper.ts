import { Assignment } from '../../../../domain/entities/Assignment.js';
import type { AssignmentOrmEntity } from '../entities/AssignmentOrmEntity.js';

export class AssignmentMapper {
  public static toDomain(row: AssignmentOrmEntity): Assignment {
    return new Assignment({
      id: row.id,
      examId: row.examId,
      classroomIndex: row.classroomIndex,
      openerUserId: row.openerUserId,
      regularUserId: row.regularUserId,
      manualOverride: row.manualOverride,
      notes: row.notes,
    });
  }

  public static toOrm(a: Assignment, target: AssignmentOrmEntity): AssignmentOrmEntity {
    target.id = a.id;
    target.examId = a.examId;
    target.classroomIndex = a.classroomIndex;
    target.openerUserId = a.openerUserId;
    target.regularUserId = a.regularUserId;
    target.manualOverride = a.manualOverride;
    target.notes = a.notes;
    return target;
  }
}
