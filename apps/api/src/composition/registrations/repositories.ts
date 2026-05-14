import { container } from 'tsyringe';
import type { DataSource } from 'typeorm';
import { IUserRepositoryToken } from '../../application/ports/repositories/IUserRepository.js';
import { IExamRepositoryToken } from '../../application/ports/repositories/IExamRepository.js';
import { IExamPeriodRepositoryToken } from '../../application/ports/repositories/IExamPeriodRepository.js';
import { IAvailabilityRepositoryToken } from '../../application/ports/repositories/IAvailabilityRepository.js';
import { IAssignmentRepositoryToken } from '../../application/ports/repositories/IAssignmentRepository.js';
import { INotificationLogRepositoryToken } from '../../application/ports/repositories/INotificationLogRepository.js';
import { IAvailabilitySubmissionRepositoryToken } from '../../application/ports/repositories/IAvailabilitySubmissionRepository.js';
import { TypeOrmUserRepository } from '../../infrastructure/persistence/typeorm/repositories/TypeOrmUserRepository.js';
import { TypeOrmExamRepository } from '../../infrastructure/persistence/typeorm/repositories/TypeOrmExamRepository.js';
import { TypeOrmExamPeriodRepository } from '../../infrastructure/persistence/typeorm/repositories/TypeOrmExamPeriodRepository.js';
import { TypeOrmAvailabilityRepository } from '../../infrastructure/persistence/typeorm/repositories/TypeOrmAvailabilityRepository.js';
import { TypeOrmAssignmentRepository } from '../../infrastructure/persistence/typeorm/repositories/TypeOrmAssignmentRepository.js';
import { TypeOrmNotificationLogRepository } from '../../infrastructure/persistence/typeorm/repositories/TypeOrmNotificationLogRepository.js';
import { TypeOrmAvailabilitySubmissionRepository } from '../../infrastructure/persistence/typeorm/repositories/TypeOrmAvailabilitySubmissionRepository.js';

/**
 * Registers all TypeORM-backed repository adapters behind the application port
 * tokens.
 */
export function registerRepositories(dataSource: DataSource): void {
  container.register(IUserRepositoryToken, {
    useValue: new TypeOrmUserRepository(dataSource),
  });
  container.register(IExamRepositoryToken, {
    useValue: new TypeOrmExamRepository(dataSource),
  });
  container.register(IExamPeriodRepositoryToken, {
    useValue: new TypeOrmExamPeriodRepository(dataSource),
  });
  container.register(IAvailabilityRepositoryToken, {
    useValue: new TypeOrmAvailabilityRepository(dataSource),
  });
  container.register(IAssignmentRepositoryToken, {
    useValue: new TypeOrmAssignmentRepository(dataSource),
  });
  container.register(INotificationLogRepositoryToken, {
    useValue: new TypeOrmNotificationLogRepository(dataSource),
  });
  container.register(IAvailabilitySubmissionRepositoryToken, {
    useValue: new TypeOrmAvailabilitySubmissionRepository(dataSource),
  });
}

