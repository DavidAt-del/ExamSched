import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { loadEnv } from '../../../config/env.js';
import { UserOrmEntity } from './entities/UserOrmEntity.js';
import { ExamPeriodOrmEntity } from './entities/ExamPeriodOrmEntity.js';
import { ExamOrmEntity } from './entities/ExamOrmEntity.js';
import { AvailabilityOrmEntity } from './entities/AvailabilityOrmEntity.js';
import { AssignmentOrmEntity } from './entities/AssignmentOrmEntity.js';
import { AvailabilitySubmissionOrmEntity } from './entities/AvailabilitySubmissionOrmEntity.js';
import { NotificationLogOrmEntity } from './entities/NotificationLogOrmEntity.js';
import { AuditLogOrmEntity } from './entities/AuditLogOrmEntity.js';
import { Init1715000000000 } from './migrations/1715000000000-Init.js';
import { AddIndexes1716000000000 } from './migrations/1716000000000-AddIndexes.js';
import { NotificationIndexes1717000000000 } from './migrations/1717000000000-NotificationIndexes.js';
import { AvailabilitySubmissions1718000000000 } from './migrations/1718000000000-AvailabilitySubmissions.js';

export function buildDataSourceOptions(
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions {
  const env = loadEnv();
  const base = {
    type: 'postgres' as const,
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    // Hard rule: never synchronize. Migrations only.
    synchronize: false,
    logging: env.NODE_ENV === 'development' ? ['error', 'warn', 'migration'] : ['error'],
    entities: [
      UserOrmEntity,
      ExamPeriodOrmEntity,
      ExamOrmEntity,
      AvailabilityOrmEntity,
      AssignmentOrmEntity,
      AvailabilitySubmissionOrmEntity,
      NotificationLogOrmEntity,
      AuditLogOrmEntity,
    ],
    migrations: [
      Init1715000000000,
      AddIndexes1716000000000,
      NotificationIndexes1717000000000,
      AvailabilitySubmissions1718000000000,
    ],
    migrationsRun: false,
  };
  return { ...base, ...overrides } as DataSourceOptions;
}

export const AppDataSource = new DataSource(buildDataSourceOptions());

export default AppDataSource;
