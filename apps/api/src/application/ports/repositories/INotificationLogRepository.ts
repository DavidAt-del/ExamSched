import type { NotificationChannel, NotificationStatus } from '@app/shared';

export interface NotificationLogEntry {
  id: string;
  userId: string;
  periodId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  /** Failure reason. Always null on success. */
  error: string | null;
  /** Timestamp at which the send attempt resolved. */
  sentAt: Date | null;
}

export interface INotificationLogRepository {
  write(entry: NotificationLogEntry): Promise<void>;
}

export const INotificationLogRepositoryToken = Symbol.for('INotificationLogRepository');
