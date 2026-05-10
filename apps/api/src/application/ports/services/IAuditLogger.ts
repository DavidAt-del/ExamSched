export interface AuditLogEntry {
  /** Caller identity. May be null for system-initiated actions. */
  actorId: string | null;
  /** Stable action verb in snake or dot case (e.g. "scheduler.run"). */
  action: string;
  /** Domain object kind: "exam_period", "user", "assignment", … */
  targetType: string | null;
  /** Stringified target id when applicable. */
  targetId: string | null;
  /** Free-form structured context. Kept small — no PII like raw passwords. */
  payload?: Record<string, unknown>;
}

export interface IAuditLogger {
  log(entry: AuditLogEntry): Promise<void>;
}

export const IAuditLoggerToken = Symbol.for('IAuditLogger');
