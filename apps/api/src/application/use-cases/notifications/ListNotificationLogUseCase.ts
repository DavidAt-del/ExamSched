import { inject, injectable } from 'tsyringe';
import {
  INotificationLogRepositoryToken,
  type INotificationLogRepository,
  type NotificationLogRow,
} from '../../ports/repositories/INotificationLogRepository.js';

export interface ListNotificationLogInput {
  periodId: string;
  limit: number;
  offset: number;
}

export interface ListNotificationLogOutput {
  rows: NotificationLogRow[];
  total: number;
}

@injectable()
export class ListNotificationLogUseCase {
  constructor(
    @inject(INotificationLogRepositoryToken)
    private readonly notificationLog: INotificationLogRepository,
  ) {}

  public async execute(input: ListNotificationLogInput): Promise<ListNotificationLogOutput> {
    return this.notificationLog.findByPeriod(input.periodId, {
      limit: input.limit,
      offset: input.offset,
    });
  }
}
