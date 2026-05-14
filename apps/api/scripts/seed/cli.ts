import type { SeedGenerationOptions, SeedProfile } from './types.js';
import { resolveSeedOptions } from './mocker.js';

const VALID_PROFILES = new Set<SeedProfile>(['demo', 'mocker', 'load']);

/**
 * Parses CLI flags for the seeding script.
 */
export function parseSeedOptions(argv: readonly string[]): SeedGenerationOptions {
  const values = new Map<string, string>();

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]!;
    if (!token.startsWith('--')) {
      continue;
    }

    const [rawKey, inlineValue] = token.slice(2).split('=', 2);
    if (!rawKey) {
      continue;
    }
    const next = argv[index + 1];
    const value = inlineValue ?? (next && !next.startsWith('--') ? next : 'true');
    if (inlineValue === undefined && next && !next.startsWith('--')) {
      index += 1;
    }
    values.set(rawKey, value);
  }

  const profile = parseProfile(values.get('profile'));
  const overrides: Partial<SeedGenerationOptions> = {};

  const seed = parseInteger(values.get('seed'));
  if (seed !== undefined) overrides.seed = seed;

  const generatedPassword = values.get('generated-password');
  if (generatedPassword !== undefined) overrides.generatedPassword = generatedPassword;

  const extraStaffCount = parseInteger(values.get('extra-staff'));
  if (extraStaffCount !== undefined) overrides.extraStaffCount = extraStaffCount;

  const extraProctorCount = parseInteger(values.get('extra-proctors'));
  if (extraProctorCount !== undefined) overrides.extraProctorCount = extraProctorCount;

  const openExamCount = parseInteger(values.get('open-exams'));
  if (openExamCount !== undefined) overrides.openExamCount = openExamCount;

  const scheduledExamCount = parseInteger(values.get('scheduled-exams'));
  if (scheduledExamCount !== undefined) overrides.scheduledExamCount = scheduledExamCount;

  const sentExamCount = parseInteger(values.get('sent-exams'));
  if (sentExamCount !== undefined) overrides.sentExamCount = sentExamCount;

  const closedExamCount = parseInteger(values.get('closed-exams'));
  if (closedExamCount !== undefined) overrides.closedExamCount = closedExamCount;

  const availabilityPositiveRate = parseRate(values.get('availability-rate'));
  if (availabilityPositiveRate !== undefined) {
    overrides.availabilityPositiveRate = availabilityPositiveRate;
  }

  const notificationFailureRate = parseRate(values.get('notification-failure-rate'));
  if (notificationFailureRate !== undefined) {
    overrides.notificationFailureRate = notificationFailureRate;
  }

  const manualOverrideRate = parseRate(values.get('manual-override-rate'));
  if (manualOverrideRate !== undefined) {
    overrides.manualOverrideRate = manualOverrideRate;
  }

  return resolveSeedOptions(profile, overrides);
}

/**
 * Help text shown in README and on `--help`.
 */
export function formatSeedHelp(): string {
  return [
    'Seed options:',
    '  --profile <demo|mocker|load>        Named dataset preset (default: demo)',
    '  --seed <number>                     Deterministic Faker seed',
    '  --extra-staff <number>              Additional generated exam staff',
    '  --extra-proctors <number>           Additional generated proctors',
    '  --open-exams <number>               Exam count for the open period',
    '  --scheduled-exams <number>          Exam count for the scheduled period',
    '  --sent-exams <number>               Exam count for the sent period',
    '  --closed-exams <number>             Exam count for the closed period',
    '  --generated-password <password>     Shared password for generated users',
    '  --availability-rate <0..1>          Probability a generated proctor is available',
    '  --notification-failure-rate <0..1>  Probability an email log row fails',
    '  --manual-override-rate <0..1>       Probability an assignment gets override notes',
  ].join('\n');
}

function parseProfile(value: string | undefined): SeedProfile {
  if (!value) {
    return 'demo';
  }
  if (!VALID_PROFILES.has(value as SeedProfile)) {
    throw new Error(`Unsupported seed profile '${value}'. Expected demo, mocker, or load.`);
  }
  return value as SeedProfile;
}

function parseInteger(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Expected a non-negative integer, received '${value}'.`);
  }
  return parsed;
}

function parseRate(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`Expected a rate between 0 and 1, received '${value}'.`);
  }
  return parsed;
}

