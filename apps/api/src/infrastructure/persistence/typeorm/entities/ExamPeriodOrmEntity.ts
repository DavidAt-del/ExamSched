import { Column, Entity, PrimaryColumn } from 'typeorm';
import { ExamPeriodStatus } from '@app/shared';

@Entity({ name: 'exam_periods' })
export class ExamPeriodOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text')
  name!: string;

  @Column('timestamptz')
  deadline!: Date;

  @Column({
    type: 'enum',
    enum: [
      ExamPeriodStatus.Open,
      ExamPeriodStatus.Closed,
      ExamPeriodStatus.Scheduled,
      ExamPeriodStatus.Sent,
    ],
  })
  status!: ExamPeriodStatus;

  @Column('uuid', { name: 'created_by' })
  createdBy!: string;

  @Column('timestamptz', { name: 'created_at' })
  createdAt!: Date;

  @Column('timestamptz', { name: 'updated_at' })
  updatedAt!: Date;
}
