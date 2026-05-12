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
    const openers = input.availableProctors.filter((p) => p.proctorType === ProctorType.Opener);
    const regulars = input.availableProctors.filter((p) => p.proctorType === ProctorType.Regular);

    const assignments: Assignment[] = [];
    const unfilled: number[] = [];

    // Helper: pick the proctor with minimum shifts, mutate the pool on success
    const pickMin = (pool: Proctor[], shifts: ReadonlyMap<string, number>): Proctor | undefined => {
      if (pool.length === 0) return undefined;
      let bestIdx = 0;
      let bestCount = shifts.get(pool[0]!.userId) ?? 0;
      for (let i = 1; i < pool.length; i += 1) {
        const c = shifts.get(pool[i]!.userId) ?? 0;
        // Tie-break: lexicographic userId for deterministic test fixtures.
        if (c < bestCount || (c === bestCount && pool[i]!.userId < pool[bestIdx]!.userId)) {
          bestIdx = i;
          bestCount = c;
        }
      }
      return pool.splice(bestIdx, 1)[0];
    };

    for (let classroom = 0; classroom < input.exam.classroomCount; classroom += 1) {
      const opener = pickMin(openers, input.shiftsByProctor);
      if (!opener) {
        unfilled.push(classroom);
        continue;
      }
      let partner: Proctor | null = pickMin(regulars, input.shiftsByProctor) ?? null;
      if (!partner) {
        partner = pickMin(openers, input.shiftsByProctor) ?? null;
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

