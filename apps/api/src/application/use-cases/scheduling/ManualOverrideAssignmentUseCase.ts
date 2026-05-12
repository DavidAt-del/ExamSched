import { inject, injectable } from 'tsyringe';
import { ExamPeriodStatus, ProctorType } from '@app/shared';
import {
  ForbiddenError,
  InvariantViolationError,
  NotFoundError,
} from '../../../domain/errors/DomainError.js';
import { Proctor } from '../../../domain/entities/Proctor.js';
import type { Assignment } from '../../../domain/entities/Assignment.js';
import { SchedulerDomainService } from '../../../domain/services/SchedulerDomainService.js';
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
import {
  IAssignmentRepositoryToken,
  type IAssignmentRepository,
} from '../../ports/repositories/IAssignmentRepository.js';
import {
  IAvailabilityRepositoryToken,
  type IAvailabilityRepository,
} from '../../ports/repositories/IAvailabilityRepository.js';
import {
  IAuditLoggerToken,
  type IAuditLogger,
} from '../../ports/services/IAuditLogger.js';

export interface ManualOverrideInput {
  actorId: string;
  examId: string;
  classroomIndex: number;
  openerUserId: string;
  regularUserId: string | null;
  notes: string | null;
}

export type AvailabilityState = 'available' | 'unavailable' | 'unknown';

export interface ManualOverrideOutput {
  assignment: Assignment;
  openerAvailability: AvailabilityState;
  regularAvailability: AvailabilityState;
  assignedDespiteUnavailable: { opener: boolean; regular: boolean };
}

function toState(value: boolean | undefined): AvailabilityState {
  if (value === true) return 'available';
  if (value === false) return 'unavailable';
  return 'unknown';
}

@injectable()
export class ManualOverrideAssignmentUseCase {
  constructor(
    @inject(IExamRepositoryToken) private readonly exams: IExamRepository,
    @inject(IExamPeriodRepositoryToken)
    private readonly periods: IExamPeriodRepository,
    @inject(IUserRepositoryToken) private readonly users: IUserRepository,
    @inject(IAssignmentRepositoryToken)
    private readonly assignments: IAssignmentRepository,
    @inject(IAvailabilityRepositoryToken)
    private readonly availability: IAvailabilityRepository,
    @inject(IAuditLoggerToken) private readonly audit: IAuditLogger,
  ) {}

  public async execute(input: ManualOverrideInput): Promise<ManualOverrideOutput> {
    if (
      input.regularUserId !== null &&
      input.regularUserId === input.openerUserId
    ) {
      throw new InvariantViolationError(
        'Opener and regular cannot be the same user',
      );
    }

    const exam = await this.exams.findById(input.examId);
    if (!exam) throw new NotFoundError('Exam');

    const period = await this.periods.findById(exam.periodId);
    if (!period) throw new NotFoundError('ExamPeriod');
    if (period.status === ExamPeriodStatus.Sent) {
      throw new InvariantViolationError(
        'Cannot edit a schedule that has already been sent',
      );
    }

    const existing = await this.assignments.findByExamAndClassroom(
      input.examId,
      input.classroomIndex,
    );
    if (!existing) {
      throw new NotFoundError('Assignment');
    }

    const opener = await this.users.findById(input.openerUserId);
    if (!opener) throw new NotFoundError('Opener user');
    if (!opener.active) throw new ForbiddenError('Opener is inactive');
    if (!opener.isProctor() || opener.proctorType !== ProctorType.Opener) {
      throw new InvariantViolationError(
        'Opener slot must be filled by a proctor with type "opener"',
      );
    }

    let regularProctor: Proctor | null = null;
    if (input.regularUserId !== null) {
      const regular = await this.users.findById(input.regularUserId);
      if (!regular) throw new NotFoundError('Regular user');
      if (!regular.active) throw new ForbiddenError('Regular is inactive');
      if (!regular.isProctor() || regular.proctorType === null) {
        throw new InvariantViolationError(
          'Regular slot must be filled by a proctor user',
        );
      }
      regularProctor = new Proctor({
        userId: regular.id,
        proctorType: regular.proctorType,
        firstName: regular.firstName,
        lastName: regular.lastName,
      });
    }

    const openerProctor = new Proctor({
      userId: opener.id,
      proctorType: opener.proctorType!,
      firstName: opener.firstName,
      lastName: opener.lastName,
    });

    if (!SchedulerDomainService.isPairAllowed(openerProctor, regularProctor)) {
      throw new InvariantViolationError(
        'Pair is not allowed: every classroom must have at least one opener',
      );
    }

    // Spec §8: a proctor MAY be assigned despite marking unavailable, but the
    // operation is flagged in the audit payload and the response so the UI
    // can require an explicit confirmation.
    const responses = await this.availability.findByExam(input.examId);
    const availabilityByUser = new Map<string, boolean>(
      responses.map((r) => [r.userId, r.available]),
    );
    const openerAvailability = toState(availabilityByUser.get(input.openerUserId));
    const regularAvailability =
      input.regularUserId === null
        ? 'unknown'
        : toState(availabilityByUser.get(input.regularUserId));
    const assignedDespiteUnavailable = {
      opener: openerAvailability === 'unavailable',
      regular: regularAvailability === 'unavailable',
    };

    const before = {
      openerUserId: existing.openerUserId,
      regularUserId: existing.regularUserId,
      manualOverride: existing.manualOverride,
    };

    existing.openerUserId = input.openerUserId;
    existing.regularUserId = input.regularUserId;
    existing.notes = input.notes;
    existing.manualOverride = true;

    await this.assignments.saveOne(existing);

    await this.audit.log({
      actorId: input.actorId,
      action: 'assignment.manual_override',
      targetType: 'assignment',
      targetId: existing.id,
      payload: {
        examId: input.examId,
        classroomIndex: input.classroomIndex,
        before,
        after: {
          openerUserId: existing.openerUserId,
          regularUserId: existing.regularUserId,
          manualOverride: existing.manualOverride,
        },
        assignedDespiteUnavailable,
      },
    });

    return {
      assignment: existing,
      openerAvailability,
      regularAvailability,
      assignedDespiteUnavailable,
    };
  }
}
