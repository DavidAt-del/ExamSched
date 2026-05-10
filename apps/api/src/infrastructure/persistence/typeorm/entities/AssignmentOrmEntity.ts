import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'assignments' })
@Index('uq_assignments_exam_classroom', ['examId', 'classroomIndex'], { unique: true })
@Index('idx_assignments_exam', ['examId'])
export class AssignmentOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'exam_id' })
  examId!: string;

  @Column('int', { name: 'classroom_index' })
  classroomIndex!: number;

  @Column('uuid', { name: 'opener_user_id' })
  openerUserId!: string;

  @Column('uuid', { name: 'regular_user_id', nullable: true })
  regularUserId!: string | null;

  @Column('boolean', { name: 'manual_override', default: false })
  manualOverride!: boolean;

  @Column('text', { nullable: true })
  notes!: string | null;
}
