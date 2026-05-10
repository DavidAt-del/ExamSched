import { randomUUID } from 'node:crypto';
import { injectable } from 'tsyringe';
import type { DataSource, Repository } from 'typeorm';
import type {
  AuditLogEntry,
  IAuditLogger,
} from '../../application/ports/services/IAuditLogger.js';
import { AuditLogOrmEntity } from '../persistence/typeorm/entities/AuditLogOrmEntity.js';

@injectable()
export class PostgresAuditLogger implements IAuditLogger {
  private readonly repo: Repository<AuditLogOrmEntity>;

  constructor(dataSource: DataSource) {
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
}
