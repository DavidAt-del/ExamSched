import { inject, injectable } from 'tsyringe';
import {
  IAuditLogQueryToken,
  type AuditLogPage,
  type IAuditLogQuery,
} from '../../../ports/services/IAuditLogQuery.js';

export interface ListAuditLogInput {
  page?: number | undefined;
  limit?: number | undefined;
  from?: Date | undefined;
  to?: Date | undefined;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

@injectable()
export class ListAuditLogUseCase {
  constructor(@inject(IAuditLogQueryToken) private readonly queryPort: IAuditLogQuery) {}

  public execute(input: ListAuditLogInput = {}): Promise<AuditLogPage> {
    const page = Math.max(1, Math.floor(input.page ?? DEFAULT_PAGE));
    const limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(input.limit ?? DEFAULT_LIMIT)));
    return this.queryPort.findPaginated({
      page,
      limit,
      from: input.from,
      to: input.to,
    });
  }
}
