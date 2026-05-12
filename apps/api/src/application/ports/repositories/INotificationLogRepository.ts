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

export interface NotificationLogRow extends NotificationLogEntry {
  firstName: string;
  lastName: string;
  nationalId: string;
}

export interface FindNotificationLogPage {
  limit: number;
  offset: number;
}

export interface FindNotificationLogResult {
  rows: NotificationLogRow[];
  total: number;
}

export interface INotificationLogRepository {
  write(entry: NotificationLogEntry): Promise<void>;
  findByPeriod(
    periodId: string,
    page: FindNotificationLogPage,
  ): Promise<FindNotificationLogResult>;
}

export const INotificationLogRepositoryToken = Symbol.for('INotificationLogRepository');
