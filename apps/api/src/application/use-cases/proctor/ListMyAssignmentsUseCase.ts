import { inject, injectable } from 'tsyringe';
import { ExamPeriodStatus } from '@app/shared';
import { ForbiddenError, NotFoundError } from '../../../domain/errors/DomainError.js';
import type { Exam } from '../../../domain/entities/Exam.js';
import type { ExamPeriod } from '../../../domain/entities/ExamPeriod.js';
import type { User } from '../../../domain/entities/User.js';
import {
  IAssignmentRepositoryToken,
  type IAssignmentRepository,
} from '../../ports/repositories/IAssignmentRepository.js';
import {
  IExamRepositoryToken,
  type IExamRepository,
} from '../../ports/repositories/IExamRepository.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../ports/repositories/IExamPeriodRepository.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../ports/repositories/IUserRepository.js';

export interface ListMyAssignmentsInput {
  userId: string;
}

export type ProctorRole = 'opener' | 'regular';

export interface MyAssignmentItem {
  examId: string;
  exam: Exam;
  period: ExamPeriod;
  classroomIndex: number;
  role: ProctorRole;
  partner: User | null;
  notes: string | null;
}

@injectable()
export class ListMyAssignmentsUseCase {
  constructor(
    @inject(IAssignmentRepositoryToken)
    private readonly assignments: IAssignmentRepository,
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
  ) {}

  public async execute(input: ListMyAssignmentsInput): Promise<MyAssignmentItem[]> {
    const me = await this.users.findById(input.userId);
    if (!me) throw new NotFoundError('User');
    if (!me.isProctor()) {
      throw new ForbiddenError('Only proctors can view their personal schedule');
    }

    const all = await this.assignments.findByUser(input.userId);
    if (all.length === 0) return [];

    // Hydrate exams + periods + partner users in batched lookups.
    const examIds = new Set(all.map((a) => a.examId));
    const partnerIds = new Set<string>();
    for (const a of all) {
      const partnerId =
        a.openerUserId === input.userId ? a.regularUserId : a.openerUserId;
      if (partnerId !== null) partnerIds.add(partnerId);
    }

    const examEntries = await Promise.all(
      Array.from(examIds).map(async (id) => {
        const e = await this.exams.findById(id);
        return e ? ([id, e] as const) : null;
      }),
    );
    const examsById = new Map(examEntries.filter((x): x is readonly [string, Exam] => x !== null));

    const periodIds = new Set<string>();
    for (const e of examsById.values()) periodIds.add(e.periodId);
    const periodEntries = await Promise.all(
      Array.from(periodIds).map(async (id) => {
        const p = await this.periods.findById(id);
        return p ? ([id, p] as const) : null;
      }),
    );
    const periodsById = new Map(
      periodEntries.filter((x): x is readonly [string, ExamPeriod] => x !== null),
    );

    const partnerEntries = await Promise.all(
      Array.from(partnerIds).map(async (id) => {
        const u = await this.users.findById(id);
        return u ? ([id, u] as const) : null;
      }),
    );
    const partnersById = new Map(
      partnerEntries.filter((x): x is readonly [string, User] => x !== null),
    );

    const items: MyAssignmentItem[] = [];
    for (const a of all) {
      const exam = examsById.get(a.examId);
      if (!exam) continue;
      const period = periodsById.get(exam.periodId);
      if (!period || period.status !== ExamPeriodStatus.Sent) continue;

      const role: ProctorRole = a.openerUserId === input.userId ? 'opener' : 'regular';
      const partnerId =
        a.openerUserId === input.userId ? a.regularUserId : a.openerUserId;
      const partner = partnerId === null ? null : partnersById.get(partnerId) ?? null;

      items.push({
        examId: a.examId,
        exam,
        period,
        classroomIndex: a.classroomIndex,
        role,
        partner,
        notes: a.notes,
      });
    }

    items.sort((l, r) =>
      l.exam.examDate === r.exam.examDate
        ? l.exam.startTime.localeCompare(r.exam.startTime)
        : l.exam.examDate.localeCompare(r.exam.examDate),
    );
    return items;
  }
}
