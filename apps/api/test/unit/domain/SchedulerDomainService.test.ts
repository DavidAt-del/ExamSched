import { describe, it, expect } from 'vitest';
import { ProctorType } from '@app/shared';
import { SchedulerDomainService } from '../../../src/domain/services/SchedulerDomainService.js';
import { Proctor } from '../../../src/domain/entities/Proctor.js';

const opener = (id: string) =>
  new Proctor({ userId: id, proctorType: ProctorType.Opener, firstName: 'O', lastName: id });
const regular = (id: string) =>
  new Proctor({ userId: id, proctorType: ProctorType.Regular, firstName: 'R', lastName: id });

describe('SchedulerDomainService', () => {
  it('forbids regular+regular', () => {
    expect(SchedulerDomainService.isPairAllowed(regular('a'), regular('b'))).toBe(false);
  });

  it('allows opener+regular', () => {
    expect(SchedulerDomainService.isPairAllowed(opener('a'), regular('b'))).toBe(true);
  });

  it('allows opener+opener as fallback', () => {
    expect(SchedulerDomainService.isPairAllowed(opener('a'), opener('b'))).toBe(true);
  });

  it('solo classroom must be staffed by opener', () => {
    expect(SchedulerDomainService.isPairAllowed(opener('a'), null)).toBe(true);
    expect(SchedulerDomainService.isPairAllowed(regular('a'), null)).toBe(false);
  });

  it('preferred pair is opener+regular', () => {
    expect(SchedulerDomainService.isPreferredPair(opener('a'), regular('b'))).toBe(true);
    expect(SchedulerDomainService.isPreferredPair(opener('a'), opener('b'))).toBe(false);
  });

  it('shift variance over only present proctors', () => {
    const m = new Map([
      ['a', 2],
      ['b', 4],
    ]);
    // mean = 3, variance = ((2-3)^2 + (4-3)^2)/2 = 1
    expect(SchedulerDomainService.shiftVariance(m)).toBe(1);
  });
});
