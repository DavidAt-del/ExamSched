import { inject, injectable } from 'tsyringe';
import { ExamCategory, ExamPeriodStatus } from '@app/shared';
import {
  InvariantViolationError,
  NotFoundError,
} from '../../../domain/errors/DomainError.js';
import { Proctor } from '../../../domain/entities/Proctor.js';
import type { Assignment } from '../../../domain/entities/Assignment.js';
import {
  ISchedulingEngineToken,
  type ISchedulingEngine,
} from '../../ports/services/ISchedulingEngine.js';
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
  IAvailabilityRepositoryToken,
  type IAvailabilityRepository,
} from '../../ports/repositories/IAvailabilityRepository.js';
import {
  IAssignmentRepositoryToken,
  type IAssignmentRepository,
} from '../../ports/repositories/IAssignmentRepository.js';
import { IClockToken, type IClock } from '../../ports/services/IClock.js';
import {
  IIdGeneratorToken,
  type IIdGenerator,
} from '../../ports/services/IIdGenerator.js';
import {
  IAuditLoggerToken,
  type IAuditLogger,
} from '../../ports/services/IAuditLogger.js';

export interface RunSchedulerInput {
  periodId: string;
  actorId: string;
}

export interface SchedulerUnfilled {
  examId: string;
  index: number;
}

export interface RunSchedulerOutput {
  assignments: Assignment[];
  unfilledClassrooms: SchedulerUnfilled[];
  // Classrooms belonging to non-standard exams (special_needs / oral) that the
  // auto-scheduler intentionally skips. Staff fill these via manual override.
  manualOnly: SchedulerUnfilled[];
}

@injectable()
export class RunSchedulerUseCase {
  constructor(
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IAvailabilityRepositoryToken)
    private readonly availability: IAvailabilityRepository,
    @inject(IAssignmentRepositoryToken)
    private readonly assignments: IAssignmentRepository,
    @inject(ISchedulingEngineToken) private readonly engine: ISchedulingEngine,
    @inject(IClockToken) private readonly clock: IClock,
    @inject(IIdGeneratorToken) private readonly ids: IIdGenerator,
    @inject(IAuditLoggerToken) private readonly audit: IAuditLogger,
  ) {}

  public async execute(input: RunSchedulerInput): Promise<RunSchedulerOutput> {
    const period = await this.periods.findById(input.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');
    if (period.status === ExamPeriodStatus.Sent) {
      throw new InvariantViolationError(
        'Cannot run scheduler for a period whose schedule has already been sent',
      );
    }

    const exams = await this.exams.findByPeriod(input.periodId);
    const proctorPool = await this.users.findAllProctors({ includeInactive: false });
    const proctorViewById = new Map<string, Proctor>();
    for (const u of proctorPool) {
      if (!u.isProctor() || u.proctorType === null) continue;
      proctorViewById.set(
        u.id,
        new Proctor({
          userId: u.id,
          proctorType: u.proctorType,
          firstName: u.firstName,
          lastName: u.lastName,
        }),
      );
    }

    const allAssignments: Assignment[] = [];
    const unfilled: SchedulerUnfilled[] = [];
    const manualOnly: SchedulerUnfilled[] = [];
    const shiftsByProctor = new Map<string, number>();

    for (const exam of exams) {
      if (exam.category !== ExamCategory.Standard) {
        // Per spec §7.4: special-needs and oral exams are excluded from the
        // auto-scheduler. Their classrooms are reported as manual-only.
        for (let i = 0; i < exam.classroomCount; i += 1) {
          manualOnly.push({ examId: exam.id, index: i });
        }
        continue;
      }
      const responses = await this.availability.findByExam(exam.id);
      const availableProctors = responses
        .filter((r) => r.available)
        .map((r) => proctorViewById.get(r.userId))
        .filter((p): p is Proctor => p !== undefined);

      const result = this.engine.schedule({
        exam,
        availableProctors,
        shiftsByProctor,
        assignmentIds: () => this.ids.next(),
      });

      allAssignments.push(...result.assignments);
      for (const idx of result.unfilledClassrooms) {
        unfilled.push({ examId: exam.id, index: idx });
      }
    }

    await this.assignments.replaceForPeriod(input.periodId, allAssignments);

    period.markScheduled(this.clock.now());
    await this.periods.save(period);

    await this.audit.log({
      actorId: input.actorId,
      action: 'scheduler.run',
      targetType: 'exam_period',
      targetId: input.periodId,
      payload: {
        exams: exams.length,
        assigned: allAssignments.length,
        unfilled: unfilled.length,
        manualOnly: manualOnly.length,
        // Variance computed only over proctors who actually got assigned —
        // matches the fairness rule from the spec (only the present pool).
        proctorsUsed: shiftsByProctor.size,
      },
    });

    return { assignments: allAssignments, unfilledClassrooms: unfilled, manualOnly };
  }

}
