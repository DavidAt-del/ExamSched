import type { AvailabilitySubmission } from '../../../domain/entities/AvailabilitySubmission.js';

export interface IAvailabilitySubmissionRepository {
  find(userId: string, periodId: string): Promise<AvailabilitySubmission | null>;
  findByUser(userId: string): Promise<AvailabilitySubmission[]>;
  save(submission: AvailabilitySubmission): Promise<void>;
}

export const IAvailabilitySubmissionRepositoryToken = Symbol.for(
  'IAvailabilitySubmissionRepository',
);
