import { describe, expect, it } from 'vitest';
import {
  buildMockSeedDataset,
  parseSeedOptions,
  resolveSeedOptions,
} from '../../../../scripts/seed/index.js';

describe('seed mocker', () => {
  it('builds deterministic datasets for the same seed and options', () => {
    const options = resolveSeedOptions('mocker', {
      seed: 7,
      extraStaffCount: 1,
      extraProctorCount: 5,
      openExamCount: 4,
      scheduledExamCount: 2,
      sentExamCount: 1,
      closedExamCount: 1,
    });

    const first = buildMockSeedDataset(options);
    const second = buildMockSeedDataset(options);

    expect(first.users).toHaveLength(6 + 1 + 5);
    expect(first.periods).toHaveLength(4);
    expect(first.exams).toHaveLength(8);
    expect(first.availabilitySubmissions).toHaveLength(
      first.users.filter((user) => user.role === 'proctor').length,
    );
    expect(first.loginHints).toHaveLength(4);
    expect(first.users.map((user) => user.nationalId)).toEqual(
      second.users.map((user) => user.nationalId),
    );
    expect(first.assignments.map((assignment) => assignment.id)).toEqual(
      second.assignments.map((assignment) => assignment.id),
    );
  });

  it('parses CLI overrides for advanced seeding', () => {
    const options = parseSeedOptions([
      '--profile',
      'load',
      '--seed',
      '19',
      '--extra-proctors',
      '30',
      '--notification-failure-rate',
      '0.2',
    ]);

    expect(options.profile).toBe('load');
    expect(options.seed).toBe(19);
    expect(options.extraProctorCount).toBe(30);
    expect(options.notificationFailureRate).toBe(0.2);
  });
});

