import 'reflect-metadata';
import { container } from 'tsyringe';
import type { DataSource } from 'typeorm';
import { loadEnv } from '../config/env.js';

import { IClockToken } from '../application/ports/services/IClock.js';
import { IIdGeneratorToken } from '../application/ports/services/IIdGenerator.js';
import { IPasswordHasherToken } from '../application/ports/services/IPasswordHasher.js';
import { ITokenServiceToken } from '../application/ports/services/ITokenService.js';
import { IEmailServiceToken } from '../application/ports/services/IEmailService.js';
import { ITempPasswordGeneratorToken } from '../application/ports/services/ITempPasswordGenerator.js';
import { IProctorRowParserToken } from '../application/ports/services/IProctorRowParser.js';

import { IUserRepositoryToken } from '../application/ports/repositories/IUserRepository.js';
import { IExamRepositoryToken } from '../application/ports/repositories/IExamRepository.js';
import { IExamPeriodRepositoryToken } from '../application/ports/repositories/IExamPeriodRepository.js';
import { IAvailabilityRepositoryToken } from '../application/ports/repositories/IAvailabilityRepository.js';
import { IAssignmentRepositoryToken } from '../application/ports/repositories/IAssignmentRepository.js';

import { SystemClock } from '../infrastructure/system/SystemClock.js';
import { UuidIdGenerator } from '../infrastructure/system/UuidIdGenerator.js';
import { CryptoTempPasswordGenerator } from '../infrastructure/system/CryptoTempPasswordGenerator.js';
import { ExcelProctorRowParser } from '../infrastructure/excel/ExcelProctorRowParser.js';
import { BcryptPasswordHasher } from '../infrastructure/auth/BcryptPasswordHasher.js';
import { JwtTokenService } from '../infrastructure/auth/JwtTokenService.js';
import {
  NoopEmailService,
  SendgridEmailService,
} from '../infrastructure/email/SendgridEmailService.js';
import { TypeOrmUserRepository } from '../infrastructure/persistence/typeorm/repositories/TypeOrmUserRepository.js';
import { TypeOrmExamRepository } from '../infrastructure/persistence/typeorm/repositories/TypeOrmExamRepository.js';
import { TypeOrmExamPeriodRepository } from '../infrastructure/persistence/typeorm/repositories/TypeOrmExamPeriodRepository.js';
import { TypeOrmAvailabilityRepository } from '../infrastructure/persistence/typeorm/repositories/TypeOrmAvailabilityRepository.js';
import { TypeOrmAssignmentRepository } from '../infrastructure/persistence/typeorm/repositories/TypeOrmAssignmentRepository.js';

export function registerDependencies(dataSource: DataSource): void {
  const env = loadEnv();

  container.registerInstance('DataSource', dataSource);

  container.register(IClockToken, { useClass: SystemClock });
  container.register(IIdGeneratorToken, { useClass: UuidIdGenerator });
  container.register(ITempPasswordGeneratorToken, {
    useClass: CryptoTempPasswordGenerator,
  });
  container.register(IProctorRowParserToken, { useClass: ExcelProctorRowParser });
  container.register(IPasswordHasherToken, {
    useValue: new BcryptPasswordHasher(env.BCRYPT_COST),
  });
  container.register(ITokenServiceToken, {
    useValue: new JwtTokenService(env.JWT_SECRET, env.JWT_TTL_SECONDS),
  });
  container.register(IEmailServiceToken, {
    useValue: env.SENDGRID_API_KEY
      ? new SendgridEmailService(env.SENDGRID_API_KEY, env.EMAIL_FROM)
      : new NoopEmailService(),
  });

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
}

export { container };
