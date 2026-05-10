import { injectable } from 'tsyringe';
import type { IClock } from '../../application/ports/services/IClock.js';

@injectable()
export class SystemClock implements IClock {
  public now(): Date {
    return new Date();
  }
}
