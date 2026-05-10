import type { Availability } from '../../../domain/entities/Availability.js';

export interface IAvailabilityRepository {
  findByUserAndExam(userId: string, examId: string): Promise<Availability | null>;
  findByUser(userId: string): Promise<Availability[]>;
  save(availability: Availability): Promise<void>;
}

export const IAvailabilityRepositoryToken = Symbol.for('IAvailabilityRepository');
