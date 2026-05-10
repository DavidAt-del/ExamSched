import { Column, Entity, PrimaryColumn } from 'typeorm';
import { NotificationChannel, NotificationStatus } from '@app/shared';

@Entity({ name: 'notification_log' })
export class NotificationLogOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'user_id' })
  userId!: string;

  @Column('uuid', { name: 'period_id' })
  periodId!: string;

  @Column({
    type: 'enum',
    enum: [NotificationChannel.Email, NotificationChannel.Sms],
  })
  channel!: NotificationChannel;

  @Column({
    type: 'enum',
    enum: [NotificationStatus.Pending, NotificationStatus.Sent, NotificationStatus.Failed],
  })
  status!: NotificationStatus;

  @Column('text', { nullable: true })
  error!: string | null;

  @Column('timestamptz', { name: 'sent_at', nullable: true })
  sentAt!: Date | null;
}
