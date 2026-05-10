import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type {
  INotificationLogRepository,
  NotificationLogEntry,
} from '../../../../application/ports/repositories/INotificationLogRepository.js';
import { NotificationLogOrmEntity } from '../entities/NotificationLogOrmEntity.js';

@injectable()
export class TypeOrmNotificationLogRepository implements INotificationLogRepository {
  private readonly repo: Repository<NotificationLogOrmEntity>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(NotificationLogOrmEntity);
  }

  public async write(entry: NotificationLogEntry): Promise<void> {
    const row = this.repo.create({
      id: entry.id,
      userId: entry.userId,
      periodId: entry.periodId,
      channel: entry.channel,
      status: entry.status,
      error: entry.error,
      sentAt: entry.sentAt,
    });
    await this.repo.save(row);
  }
}
