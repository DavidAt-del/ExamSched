import { inject, injectable } from 'tsyringe';
import {
  ExamPeriodStatus,
  NotificationChannel,
  NotificationStatus,
} from '@app/shared';
import {
  InvariantViolationError,
  NotFoundError,
} from '../../../domain/errors/DomainError.js';
import type { Assignment } from '../../../domain/entities/Assignment.js';
import type { User } from '../../../domain/entities/User.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../ports/repositories/IExamPeriodRepository.js';
import {
  IExamRepositoryToken,
  type IExamRepository,
} from '../../ports/repositories/IExamRepository.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../ports/repositories/IUserRepository.js';
import {
  IAssignmentRepositoryToken,
  type IAssignmentRepository,
} from '../../ports/repositories/IAssignmentRepository.js';
import {
  INotificationLogRepositoryToken,
  type INotificationLogRepository,
} from '../../ports/repositories/INotificationLogRepository.js';
import {
  IEmailServiceToken,
  type IEmailService,
} from '../../ports/services/IEmailService.js';
import { IClockToken, type IClock } from '../../ports/services/IClock.js';
import {
  IIdGeneratorToken,
  type IIdGenerator,
} from '../../ports/services/IIdGenerator.js';
import {
  IAuditLoggerToken,
  type IAuditLogger,
} from '../../ports/services/IAuditLogger.js';
import {
  IScheduleEmailBuilderToken,
  type IScheduleEmailBuilder,
  type ScheduleEmailItem,
} from '../../ports/services/IScheduleEmailBuilder.js';

export interface SendSchedulesInput {
  actorId: string;
  periodId: string;
  /** Optional whitelist of proctor user ids; empty / undefined → all assigned. */
  userIds?: string[] | undefined;
}

export interface SendSchedulesOutput {
  sent: number;
  skipped: number;
  failed: number;
}

@injectable()
export class SendSchedulesUseCase {
  constructor(
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IAssignmentRepositoryToken)
    private readonly assignments: IAssignmentRepository,
    @inject(INotificationLogRepositoryToken)
    private readonly notifLog: INotificationLogRepository,
    @inject(IEmailServiceToken) private readonly email: IEmailService,
    @inject(IScheduleEmailBuilderToken)
    private readonly emailBuilder: IScheduleEmailBuilder,
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IIdGeneratorToken) private readonly ids: IIdGenerator,
    @inject(IAuditLoggerToken) private readonly audit: IAuditLogger,
  ) {}

  public async execute(input: SendSchedulesInput): Promise<SendSchedulesOutput> {
    const period = await this.periods.findById(input.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');
    if (period.status !== ExamPeriodStatus.Scheduled) {
      throw new InvariantViolationError(
        'Schedules can only be sent for a period whose status is "scheduled"',
      );
    }

    const assignmentList = await this.assignments.findByPeriod(input.periodId);
    const exams = await this.exams.findByPeriod(input.periodId);
    const examsById = new Map(exams.map((e) => [e.id, e]));

    const filter =
      input.userIds && input.userIds.length > 0
        ? new Set(input.userIds)
        : null;

    // Group assignments per recipient. Each user could be opener on one
    // classroom and regular on another, so we track all rows for them.
    const itemsByUser = new Map<string, Assignment[]>();
    for (const a of assignmentList) {
      addRecipient(itemsByUser, a.openerUserId, a, filter);
      if (a.regularUserId !== null) {
        addRecipient(itemsByUser, a.regularUserId, a, filter);
      }
    }

    // Resolve every distinct recipient + every distinct partner.
    const userIdsToLoad = new Set(itemsByUser.keys());
    for (const a of assignmentList) {
      userIdsToLoad.add(a.openerUserId);
      if (a.regularUserId !== null) userIdsToLoad.add(a.regularUserId);
    }
    const usersById = new Map<string, User>();
    await Promise.all(
      Array.from(userIdsToLoad).map(async (id) => {
        const u = await this.users.findById(id);
        if (u) usersById.set(id, u);
      }),
    );

    let sent = 0;
    let skipped = 0;
    let failed = 0;
    const now = this.clock.now();

    for (const [userId, userAssignments] of itemsByUser) {
      const user = usersById.get(userId);
      if (!user) {
        // Recipient was deleted between scheduling and sending — record and skip.
        await this.writeLog({
          userId,
          periodId: input.periodId,
          status: NotificationStatus.Failed,
          error: 'user not found',
          sentAt: now,
        });
        skipped += 1;
        continue;
      }
      if (user.email === null) {
        await this.writeLog({
          userId,
          periodId: input.periodId,
          status: NotificationStatus.Failed,
          error: 'no email',
          sentAt: now,
        });
        skipped += 1;
        continue;
      }

      const items: ScheduleEmailItem[] = userAssignments
        .map((a) => {
          const exam = examsById.get(a.examId);
          if (!exam) return null;
          const partnerId =
            a.openerUserId === userId ? a.regularUserId : a.openerUserId;
          const partner = partnerId === null ? null : usersById.get(partnerId) ?? null;
          return { assignment: a, exam, partner };
        })
        .filter((x): x is ScheduleEmailItem => x !== null);

      const message = this.emailBuilder.build({ user, period, items });

      try {
        await this.email.send(message);
        await this.writeLog({
          userId,
          periodId: input.periodId,
          status: NotificationStatus.Sent,
          error: null,
          sentAt: now,
        });
        sent += 1;
      } catch (err) {
        const reason = err instanceof Error ? err.message : 'unknown error';
        await this.writeLog({
          userId,
          periodId: input.periodId,
          status: NotificationStatus.Failed,
          error: reason,
          sentAt: now,
        });
        failed += 1;
      }
    }

    period.status = ExamPeriodStatus.Sent;
    period.updatedAt = now;
    await this.periods.save(period);

    await this.audit.log({
      actorId: input.actorId,
      action: 'schedule.sent',
      targetType: 'exam_period',
      targetId: input.periodId,
      payload: {
        sent,
        skipped,
        failed,
        filtered: filter !== null,
      },
    });

    return { sent, skipped, failed };
  }

  private async writeLog(args: {
    userId: string;
    periodId: string;
    status: NotificationStatus;
    error: string | null;
    sentAt: Date | null;
  }): Promise<void> {
    await this.notifLog.write({
      id: this.ids.next(),
      userId: args.userId,
      periodId: args.periodId,
      channel: NotificationChannel.Email,
      status: args.status,
      error: args.error,
      sentAt: args.sentAt,
    });
  }
}

function addRecipient(
  bucket: Map<string, Assignment[]>,
  userId: string,
  assignment: Assignment,
  filter: ReadonlySet<string> | null,
): void {
  if (filter !== null && !filter.has(userId)) return;
  const list = bucket.get(userId) ?? [];
  list.push(assignment);
  bucket.set(userId, list);
}
