import { injectable } from 'tsyringe';
import { ProctorType } from '@app/shared';
import { Assignment } from '../../domain/entities/Assignment.js';
import type { Proctor } from '../../domain/entities/Proctor.js';
import { SchedulerDomainService } from '../../domain/services/SchedulerDomainService.js';
import { InvariantViolationError } from '../../domain/errors/DomainError.js';
import type {
  ISchedulingEngine,
  SchedulingInput,
  SchedulingResult,
} from '../../application/ports/services/ISchedulingEngine.js';

// V1 greedy: prefer (opener, regular) pairs, fall back to (opener, opener), then
// solo opener, balancing by current shifts-per-proctor count. Returns unfilled
// classroom indices when there isn't enough coverage.
@injectable()
export class GreedySchedulingEngine implements ISchedulingEngine {
  public schedule(input: SchedulingInput): SchedulingResult {
    const openers = input.availableProctors
      .filter((p) => p.proctorType === ProctorType.Opener)
      .sort(byShifts(input.shiftsByProctor));
    const regulars = input.availableProctors
      .filter((p) => p.proctorType === ProctorType.Regular)
      .sort(byShifts(input.shiftsByProctor));

    const assignments: Assignment[] = [];
    const unfilled: number[] = [];

    for (let classroom = 0; classroom < input.exam.classroomCount; classroom += 1) {
      const opener = openers.shift();
      if (!opener) {
        unfilled.push(classroom);
        continue;
      }
      let partner: Proctor | null = regulars.shift() ?? null;
      if (!partner) {
        partner = openers.shift() ?? null;
      }
      if (partner !== null && !SchedulerDomainService.isPairAllowed(opener, partner)) {
        throw new InvariantViolationError('Greedy engine produced an illegal pair');
      }
      assignments.push(
        new Assignment({
          id: input.assignmentIds(),
          examId: input.exam.id,
          classroomIndex: classroom,
          openerUserId: opener.userId,
          regularUserId: partner ? partner.userId : null,
          manualOverride: false,
          notes: null,
        }),
      );
      input.shiftsByProctor.set(opener.userId, (input.shiftsByProctor.get(opener.userId) ?? 0) + 1);
      if (partner) {
        input.shiftsByProctor.set(
          partner.userId,
          (input.shiftsByProctor.get(partner.userId) ?? 0) + 1,
        );
      }
    }
    return { assignments, unfilledClassrooms: unfilled };
  }
}

function byShifts(shifts: ReadonlyMap<string, number>) {
  return (a: Proctor, b: Proctor): number =>
    (shifts.get(a.userId) ?? 0) - (shifts.get(b.userId) ?? 0);
}
