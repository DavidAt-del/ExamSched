import { container } from 'tsyringe';
import type { DataSource } from 'typeorm';
import type { Env } from '../../config/env.js';
import { IClockToken } from '../../application/ports/services/IClock.js';
import { IIdGeneratorToken } from '../../application/ports/services/IIdGenerator.js';
import { IPasswordHasherToken } from '../../application/ports/services/IPasswordHasher.js';
import { ITokenServiceToken } from '../../application/ports/services/ITokenService.js';
import { IEmailServiceToken } from '../../application/ports/services/IEmailService.js';
import { ITempPasswordGeneratorToken } from '../../application/ports/services/ITempPasswordGenerator.js';
import { IProctorRowParserToken } from '../../application/ports/services/IProctorRowParser.js';
import { IScheduleExporterToken } from '../../application/ports/services/IScheduleExporter.js';
import { ISchedulingEngineToken } from '../../application/ports/services/ISchedulingEngine.js';
import { IScheduleEmailBuilderToken } from '../../application/ports/services/IScheduleEmailBuilder.js';
import { SystemClock } from '../../infrastructure/system/SystemClock.js';
import { UuidIdGenerator } from '../../infrastructure/system/UuidIdGenerator.js';
import { CryptoTempPasswordGenerator } from '../../infrastructure/system/CryptoTempPasswordGenerator.js';
import { ExcelProctorRowParser } from '../../infrastructure/excel/ExcelProctorRowParser.js';
import { ExcelScheduleExporter } from '../../infrastructure/excel/ExcelScheduleExporter.js';
import { ScheduleEmailBuilder } from '../../infrastructure/email/ScheduleEmailBuilder.js';
import { GreedySchedulingEngine } from '../../infrastructure/scheduler/GreedySchedulingEngine.js';
import { BcryptPasswordHasher } from '../../infrastructure/auth/BcryptPasswordHasher.js';
import { JwtTokenService } from '../../infrastructure/auth/JwtTokenService.js';
import {
  NoopEmailService,
  SendgridEmailService,
} from '../../infrastructure/email/SendgridEmailService.js';

/**
 * Registers infrastructure-backed service implementations such as hashing,
 * token issuance, email delivery, and scheduling/export helpers.
 */
export function registerServices(dataSource: DataSource, env: Env): void {
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

  container.register(ISchedulingEngineToken, { useClass: GreedySchedulingEngine });
  container.register(IScheduleExporterToken, { useClass: ExcelScheduleExporter });
  container.register(IScheduleEmailBuilderToken, { useClass: ScheduleEmailBuilder });
}

