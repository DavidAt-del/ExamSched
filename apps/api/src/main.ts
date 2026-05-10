import 'reflect-metadata';
import { loadEnv } from './config/env.js';
import {
  AppDataSource,
  buildDataSourceOptions,
} from './infrastructure/persistence/typeorm/data-source.js';
import { buildCloudSqlOptions } from './infrastructure/gcp/cloud-sql.js';
import { registerDependencies } from './composition/container.js';
import { buildApp } from './interfaces/http/app.js';
import { DataSource, type DataSourceOptions } from 'typeorm';
import pino from 'pino';

async function bootstrap(): Promise<void> {
  const env = loadEnv();
  const log = pino({ level: env.LOG_LEVEL });

  let dataSource = AppDataSource;
  if (env.CLOUD_SQL_INSTANCE) {
    log.info({ instance: env.CLOUD_SQL_INSTANCE }, 'Using Cloud SQL Connector with IAM auth');
    const cloudSqlOpts = await buildCloudSqlOptions({
      instanceConnectionName: env.CLOUD_SQL_INSTANCE,
      username: env.DB_USER,
      database: env.DB_NAME,
    });
    const merged = {
      ...buildDataSourceOptions(),
      ...cloudSqlOpts,
    } as DataSourceOptions;
    dataSource = new DataSource(merged);
  }

  await dataSource.initialize();
  await dataSource.runMigrations({ transaction: 'all' });
  log.info('Database initialized and migrations applied');

  registerDependencies(dataSource);

  const app = buildApp();
  const server = app.listen(env.PORT, () => {
    log.info({ port: env.PORT }, 'API listening');
  });

  const shutdown = async (signal: string): Promise<void> => {
    log.info({ signal }, 'Shutting down');
    server.close();
    await dataSource.destroy();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Fatal during bootstrap', err);
  process.exit(1);
});
