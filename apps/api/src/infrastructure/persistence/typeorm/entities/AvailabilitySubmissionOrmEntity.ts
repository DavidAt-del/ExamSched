import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'availability_submissions' })
@Index('uq_availability_submissions_user_period', ['userId', 'periodId'], { unique: true })
@Index('idx_availability_submissions_period', ['periodId'])
@Index('idx_availability_submissions_user', ['userId'])
export class AvailabilitySubmissionOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'period_id' })
  periodId!: string;

  @Column('timestamptz', { name: 'submitted_at' })
  submittedAt!: Date;
}
