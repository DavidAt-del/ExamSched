import { inject, injectable } from 'tsyringe';
import { NotFoundError } from '../../../domain/errors/DomainError.js';
import type { Assignment } from '../../../domain/entities/Assignment.js';
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
import {
  IScheduleExporterToken,
  type IScheduleExporter,
} from '../../ports/services/IScheduleExporter.js';

export interface ExportScheduleInput {
  periodId: string;
}

export interface ExportScheduleOutput {
  buffer: Buffer;
  filename: string;
}

@injectable()
export class ExportScheduleUseCase {
  constructor(
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IAssignmentRepositoryToken)
    private readonly assignments: IAssignmentRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IScheduleExporterToken)
    private readonly exporter: IScheduleExporter,
  ) {}

  public async execute(input: ExportScheduleInput): Promise<ExportScheduleOutput> {
    const period = await this.periods.findById(input.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');

    const exams = await this.exams.findByPeriod(input.periodId);
    const all = await this.assignments.findByPeriod(input.periodId);

    const assignmentsByExam = new Map<string, Assignment[]>();
    for (const a of all) {
      const list = assignmentsByExam.get(a.examId) ?? [];
      list.push(a);
      assignmentsByExam.set(a.examId, list);
    }

    const ids = new Set<string>();
    for (const a of all) {
      ids.add(a.openerUserId);
      if (a.regularUserId !== null) ids.add(a.regularUserId);
    }
    const usersById = new Map(
      (
        await Promise.all(
          Array.from(ids).map(async (id) => {
            const u = await this.users.findById(id);
            return u ? ([id, u] as const) : null;
          }),
        )
      ).filter((x): x is readonly [string, NonNullable<typeof x>[1]] => x !== null),
    );

    const buffer = await this.exporter.export({
      period,
      exams,
      assignmentsByExam,
      usersById,
    });
    return {
      buffer,
      filename: `schedule-${period.id}.xlsx`,
    };
  }
}
