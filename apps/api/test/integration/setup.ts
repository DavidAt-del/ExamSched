import 'reflect-metadata';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../../src/infrastructure/persistence/typeorm/data-source.js';

export interface TestDb {
  container: StartedPostgreSqlContainer;
  dataSource: DataSource;
  stop: () => Promise<void>;
}

export async function startTestDb(): Promise<TestDb> {
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('proctor_test')
    .withUsername('app')
    .withPassword('app')
    .start();

  const ds = new DataSource({
    ...buildDataSourceOptions({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: container.getUsername(),
      password: container.getPassword(),
      database: container.getDatabase(),
    }),
  });

  await ds.initialize();
  await ds.runMigrations({ transaction: 'all' });

  return {
    container,
    dataSource: ds,
    stop: async () => {
      if (ds.isInitialized) await ds.destroy();
      await container.stop();
    },
  };
}
