import { Exam } from '../../../../domain/entities/Exam.js';
import type { ExamOrmEntity } from '../entities/ExamOrmEntity.js';

export class ExamMapper {
  public static toDomain(row: ExamOrmEntity): Exam {
    return new Exam({
      id: row.id,
      periodId: row.periodId,
      examDate: row.examDate,
      startTime: row.startTime,
      endTime: row.endTime,
      classroomCount: row.classroomCount,
      category: row.category,
    });
  }

  public static toOrm(exam: Exam, target: ExamOrmEntity): ExamOrmEntity {
    target.id = exam.id;
    target.periodId = exam.periodId;
    target.examDate = exam.examDate;
    target.startTime = exam.startTime;
    target.endTime = exam.endTime;
    target.classroomCount = exam.classroomCount;
    target.category = exam.category;
    return target;
  }
}
