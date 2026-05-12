import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { ExamCategory } from '@app/shared';

@Entity({ name: 'exams' })
@Index('idx_exams_period', ['periodId'])
export class ExamOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'period_id' })
  periodId!: string;

  @Column('date', { name: 'exam_date' })
  examDate!: string;

  @Column('time', { name: 'start_time' })
  startTime!: string;

  @Column('time', { name: 'end_time' })
  endTime!: string;

  @Column('int', { name: 'classroom_count' })
  classroomCount!: number;

  @Column({
    type: 'enum',
    enum: [ExamCategory.Standard, ExamCategory.SpecialNeeds, ExamCategory.Oral],
    enumName: 'exam_category',
    default: ExamCategory.Standard,
  })
  category!: ExamCategory;
}
