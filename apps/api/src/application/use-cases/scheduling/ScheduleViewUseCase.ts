import { inject, injectable } from 'tsyringe';
import type { Exam } from '../../../domain/entities/Exam.js';
import type { Assignment } from '../../../domain/entities/Assignment.js';
import type { ExamPeriod } from '../../../domain/entities/ExamPeriod.js';
import type { User } from '../../../domain/entities/User.js';
import { NotFoundError } from '../../../domain/errors/DomainError.js';
import {
  IExamRepositoryToken,
  type IExamRepository,
} from '../../ports/repositories/IExamRepository.js';
import {
  IExamPeriodRepositoryToken,
  type IExamPeriodRepository,
} from '../../ports/repositories/IExamPeriodRepository.js';
import {
  IAssignmentRepositoryToken,
  type IAssignmentRepository,
} from '../../ports/repositories/IAssignmentRepository.js';
import {
  IUserRepositoryToken,
  type IUserRepository,
} from '../../ports/repositories/IUserRepository.js';

export interface ScheduleViewInput {
  periodId: string;
}

export interface ScheduleViewExam {
  exam: Exam;
  assignments: Assignment[];
}

export interface ScheduleViewOutput {
  period: ExamPeriod;
  exams: ScheduleViewExam[];
  /** Indexed by user id; only contains users that appear in assignments. */
  users: Map<string, User>;
}

@injectable()
export class ScheduleViewUseCase {
  constructor(
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IAssignmentRepositoryToken)
    private readonly assignments: IAssignmentRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
  ) {}

  public async execute(input: ScheduleViewInput): Promise<ScheduleViewOutput> {
    const period = await this.periods.findById(input.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');

    const exams = await this.exams.findByPeriod(input.periodId);
    const allAssignments = await this.assignments.findByPeriod(input.periodId);

    // Bucket assignments by exam id once.
    const byExam = new Map<string, Assignment[]>();
    for (const a of allAssignments) {
      const list = byExam.get(a.examId) ?? [];
      list.push(a);
      byExam.set(a.examId, list);
    }

    // Resolve every distinct user that shows up as opener or regular.
    const ids = new Set<string>();
    for (const a of allAssignments) {
      ids.add(a.openerUserId);
      if (a.regularUserId !== null) ids.add(a.regularUserId);
    }
    const users = new Map<string, User>();
    await Promise.all(
      Array.from(ids).map(async (id) => {
        const u = await this.users.findById(id);
        if (u) users.set(id, u);
      }),
    );

    return {
      period,
      exams: exams.map((exam) => ({
        exam,
        assignments: (byExam.get(exam.id) ?? []).sort(
          (l, r) => l.classroomIndex - r.classroomIndex,
        ),
      })),
      users,
    };
  }
}
