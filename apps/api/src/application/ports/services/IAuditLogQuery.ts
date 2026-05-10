export interface AuditLogQueryItem {
  id: string;
  actorId: string | null;
  /** Joined from users table; null when actor is missing or system-initiated. */
  actorName: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  payload: Record<string, unknown> | null;
  createdAt: Date;
}

export interface AuditLogPage {
  items: AuditLogQueryItem[];
  total: number;
  page: number;
  limit: number;
}

export interface IAuditLogQuery {
  /**
   * Paginated read of the audit log, newest first. `from`/`to` filter by
   * `created_at` (inclusive). The query LEFT JOINs users so the caller does
   * not need to issue an N+1 lookup to render actor names.
   */
  findPaginated(opts: {
    page: number;
    limit: number;
    from?: Date | undefined;
    to?: Date | undefined;
  }): Promise<AuditLogPage>;
}

export const IAuditLogQueryToken = Symbol.for('IAuditLogQuery');
