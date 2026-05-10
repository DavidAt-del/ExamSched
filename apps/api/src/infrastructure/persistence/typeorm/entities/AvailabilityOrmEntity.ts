import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'availabilities' })
@Index('uq_availabilities_user_exam', ['userId', 'examId'], { unique: true })
@Index('idx_availabilities_exam', ['examId'])
@Index('idx_availabilities_user', ['userId'])
export class AvailabilityOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'exam_id' })
  examId!: string;

  @Column('boolean')
  available!: boolean;

  @Column('timestamptz', { name: 'submitted_at' })
  submittedAt!: Date;
}
