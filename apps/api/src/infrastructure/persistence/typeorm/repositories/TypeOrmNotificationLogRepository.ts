import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type {
  FindNotificationLogPage,
  FindNotificationLogResult,
  INotificationLogRepository,
  NotificationLogEntry,
  NotificationLogRow,
} from '../../../../application/ports/repositories/INotificationLogRepository.js';
import { NotificationLogOrmEntity } from '../entities/NotificationLogOrmEntity.js';
import { UserOrmEntity } from '../entities/UserOrmEntity.js';

@injectable()
export class TypeOrmNotificationLogRepository implements INotificationLogRepository {
  private readonly repo: Repository<NotificationLogOrmEntity>;
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
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

  public async findByPeriod(
    periodId: string,
    page: FindNotificationLogPage,
  ): Promise<FindNotificationLogResult> {
    const baseQb = this.repo
      .createQueryBuilder('n')
      .innerJoin(UserOrmEntity, 'u', 'u.id = n.user_id')
      .where('n.period_id = :periodId', { periodId });

    const [raw, total] = await Promise.all([
      baseQb
        .clone()
        .select([
          'n.id AS id',
          'n.user_id AS "userId"',
          'n.period_id AS "periodId"',
          'n.channel AS channel',
          'n.status AS status',
          'n.error AS error',
          'n.sent_at AS "sentAt"',
          'u.first_name AS "firstName"',
          'u.last_name AS "lastName"',
          'u.national_id AS "nationalId"',
        ])
        // sent_at can be null for failed sends; order them last but still recent-first.
        .orderBy('n.sent_at', 'DESC', 'NULLS LAST')
        .limit(page.limit)
        .offset(page.offset)
        .getRawMany<{
          id: string;
          userId: string;
          periodId: string;
          channel: NotificationLogRow['channel'];
          status: NotificationLogRow['status'];
          error: string | null;
          sentAt: Date | null;
          firstName: string;
          lastName: string;
          nationalId: string;
        }>(),
      baseQb.clone().getCount(),
    ]);

    const rows: NotificationLogRow[] = raw.map((r) => ({
      id: r.id,
      userId: r.userId,
      periodId: r.periodId,
      channel: r.channel,
      status: r.status,
      error: r.error,
      sentAt: r.sentAt,
      firstName: r.firstName,
      lastName: r.lastName,
      nationalId: r.nationalId,
    }));

    return { rows, total };
  }
}
