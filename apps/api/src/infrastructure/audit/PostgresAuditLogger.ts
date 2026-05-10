import { randomUUID } from 'node:crypto';
import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type {
  AuditLogEntry,
  IAuditLogger,
} from '../../application/ports/services/IAuditLogger.js';
import type {
  AuditLogPage,
  IAuditLogQuery,
} from '../../application/ports/services/IAuditLogQuery.js';
import { AuditLogOrmEntity } from '../persistence/typeorm/entities/AuditLogOrmEntity.js';
import { UserOrmEntity } from '../persistence/typeorm/entities/UserOrmEntity.js';

@injectable()
export class PostgresAuditLogger implements IAuditLogger, IAuditLogQuery {
  private readonly repo: Repository<AuditLogOrmEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = dataSource.getRepository(AuditLogOrmEntity);
  }

  public async log(entry: AuditLogEntry): Promise<void> {
    const row = this.repo.create({
      id: randomUUID(),
      actorId: entry.actorId,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      payload: entry.payload ?? null,
      createdAt: new Date(),
    });
    await this.repo.save(row);
  }

  public async findPaginated(opts: {
    page: number;
    limit: number;
    from?: Date | undefined;
    to?: Date | undefined;
  }): Promise<AuditLogPage> {
    const page = Math.max(1, Math.floor(opts.page));
    const limit = Math.max(1, Math.min(200, Math.floor(opts.limit)));

    const qb = this.repo
      .createQueryBuilder('a')
      .leftJoin(UserOrmEntity, 'u', 'u.id = a.actor_id')
      .select([
        'a.id AS id',
        'a.actor_id AS actor_id',
        "(u.first_name || ' ' || u.last_name) AS actor_name",
        'a.action AS action',
        'a.target_type AS target_type',
        'a.target_id AS target_id',
        'a.payload AS payload',
        'a.created_at AS created_at',
      ])
      .orderBy('a.created_at', 'DESC')
      .offset((page - 1) * limit)
      .limit(limit);

    if (opts.from !== undefined) qb.andWhere('a.created_at >= :from', { from: opts.from });
    if (opts.to !== undefined) qb.andWhere('a.created_at <= :to', { to: opts.to });

    const countQb = this.repo.createQueryBuilder('a');
    if (opts.from !== undefined) countQb.andWhere('a.created_at >= :from', { from: opts.from });
    if (opts.to !== undefined) countQb.andWhere('a.created_at <= :to', { to: opts.to });

    const [rawItems, total] = await Promise.all([qb.getRawMany(), countQb.getCount()]);

    return {
      page,
      limit,
      total,
      items: rawItems.map((r: Record<string, unknown>) => ({
        id: String(r.id),
        actorId: r.actor_id === null ? null : String(r.actor_id),
        actorName:
          r.actor_name === null || r.actor_name === undefined ? null : String(r.actor_name),
        action: String(r.action),
        targetType: r.target_type === null ? null : String(r.target_type),
        targetId: r.target_id === null ? null : String(r.target_id),
        payload: r.payload === null ? null : (r.payload as Record<string, unknown>),
        createdAt: r.created_at instanceof Date ? r.created_at : new Date(String(r.created_at)),
      })),
    };
  }
}
