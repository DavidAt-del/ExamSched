import type { Availability } from '../../../domain/entities/Availability.js';

export interface IAvailabilityRepository {
  findByUserAndExam(userId: string, examId: string): Promise<Availability | null>;
  findByUser(userId: string): Promise<Availability[]>;
  findByExam(examId: string): Promise<Availability[]>;
  countAvailableForExam(examId: string): Promise<number>;
  save(availability: Availability): Promise<void>;
}

export const IAvailabilityRepositoryToken = Symbol.for('IAvailabilityRepository');
