import { ProctorType } from '@app/shared';
import type { Proctor } from '../entities/Proctor.js';

// Pure domain rules for proctor pairing. No I/O, no randomness — fully testable.
export class SchedulerDomainService {
  public static isPairAllowed(a: Proctor, b: Proctor | null): boolean {
    if (b === null) {
      // A solo classroom must be staffed by an opener.
      return a.proctorType === ProctorType.Opener;
    }
    const types = [a.proctorType, b.proctorType];
    const openers = types.filter((t) => t === ProctorType.Opener).length;
    // Forbidden: (regular, regular) — there must be ≥ 1 opener.
    return openers >= 1;
  }

  public static isPreferredPair(a: Proctor, b: Proctor): boolean {
    const types = new Set([a.proctorType, b.proctorType]);
    return types.has(ProctorType.Opener) && types.has(ProctorType.Regular);
  }

  // Variance-of-shifts fairness metric, computed across only the proctors
  // present in the input (those who marked the day).
  public static shiftVariance(shiftsByProctor: ReadonlyMap<string, number>): number {
    const values = [...shiftsByProctor.values()];
    if (values.length === 0) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const sq = values.reduce((s, v) => s + (v - mean) ** 2, 0);
    return sq / values.length;
  }
}
