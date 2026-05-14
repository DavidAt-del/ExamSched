import { container } from 'tsyringe';
import type { DataSource } from 'typeorm';
import { IAuditLoggerToken } from '../../application/ports/services/IAuditLogger.js';
import { IAuditLogQueryToken } from '../../application/ports/services/IAuditLogQuery.js';
import { PostgresAuditLogger } from '../../infrastructure/audit/PostgresAuditLogger.js';

/**
 * Registers the shared audit logger/query adapter used by admin audit screens
 * and write-side audit events.
 */
export function registerAuditServices(dataSource: DataSource): void {
  const auditLogger = new PostgresAuditLogger(dataSource);
  container.register(IAuditLoggerToken, { useValue: auditLogger });
  container.register(IAuditLogQueryToken, { useValue: auditLogger });
}

