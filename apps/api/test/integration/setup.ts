import 'reflect-metadata';
import { execSync } from 'node:child_process';
import type { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from '../../src/infrastructure/persistence/typeorm/data-source.js';

export interface TestDb {
  container: StartedPostgreSqlContainer;
  dataSource: DataSource;
  stop: () => Promise<void>;
}

function configureContainerRuntimeCompatibility(): void {
  if (process.env.TESTCONTAINERS_RYUK_DISABLED) {
    return;
  }

  try {
    const versionOutput = execSync('docker --version', {
      stdio: ['ignore', 'pipe', 'ignore'],
      encoding: 'utf8',
    }).toLowerCase();

    if (versionOutput.includes('podman')) {
      process.env.TESTCONTAINERS_RYUK_DISABLED = 'true';
    }
  } catch {
    // Leave Testcontainers defaults in place when docker isn't available or
    // version detection fails.
  }
}

export async function startTestDb(): Promise<TestDb> {
  configureContainerRuntimeCompatibility();

  const { PostgreSqlContainer } = await import('@testcontainers/postgresql');
  const container = await new PostgreSqlContainer('postgres:17')
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
