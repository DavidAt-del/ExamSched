import 'reflect-metadata';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { loadEnv } from '../../../config/env.js';
import { UserOrmEntity } from './entities/UserOrmEntity.js';
import { ExamPeriodOrmEntity } from './entities/ExamPeriodOrmEntity.js';
import { ExamOrmEntity } from './entities/ExamOrmEntity.js';
import { AvailabilityOrmEntity } from './entities/AvailabilityOrmEntity.js';
import { AssignmentOrmEntity } from './entities/AssignmentOrmEntity.js';
import { NotificationLogOrmEntity } from './entities/NotificationLogOrmEntity.js';
import { AuditLogOrmEntity } from './entities/AuditLogOrmEntity.js';
import { Init1715000000000 } from './migrations/1715000000000-Init.js';
import { AddIndexes1716000000000 } from './migrations/1716000000000-AddIndexes.js';

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
      NotificationLogOrmEntity,
      AuditLogOrmEntity,
    ],
    migrations: [Init1715000000000, AddIndexes1716000000000],
    migrationsRun: false,
  };
  return { ...base, ...overrides } as DataSourceOptions;
}

export const AppDataSource = new DataSource(buildDataSourceOptions());

export default AppDataSource;
