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
import { IClockToken, type IClock } from '../../ports/services/IClock.js';
import { slugifyPeriodName } from './slugifyPeriodName.js';

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
    @inject(IClockToken) private readonly clock: IClock,
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
    const slug = slugifyPeriodName(period.name);
    // UTC YYYY-MM-DD. Avoids tz wiring; matches the rest of the API's date
    // handling (ISO-8601 over the wire).
    const ymd = this.clock.now().toISOString().slice(0, 10);
    return {
      buffer,
      filename: `schedule-${slug || period.id}-${ymd}.xlsx`,
    };
  }
}
