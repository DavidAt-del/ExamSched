import { randomUUID } from 'node:crypto';
import { injectable } from 'tsyringe';
import type { IIdGenerator } from '../../application/ports/services/IIdGenerator.js';

@injectable()
export class UuidIdGenerator implements IIdGenerator {
  public next(): string {
    return randomUUID();
  }
}
