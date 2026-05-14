import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, type ClientConfig } from 'pg';
import { z } from 'zod';
import { buildCloudSqlOptions } from '../src/infrastructure/gcp/cloud-sql.js';
import {
  buildMockSeedDataset,
  formatSeedHelp,
  formatSeedSummary,
  parseSeedOptions,
  seedDatabase,
  truncateSeedData,
} from './seed/index.js';

const SeedGcpEnvSchema = z.object({
  CLOUD_SQL_INSTANCE: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_NAME: z.string().min(1),
});

export interface SeedGcpConfig {
  instanceConnectionName: string;
  user: string;
  database: string;
}

/**
 * Resolves the Cloud SQL settings required for remote seeding.
 *
 * Unlike the local seeder, this path intentionally does not provide localhost/
 * password defaults: the Cloud Run Job must receive the real GCP connection
 * details explicitly.
 */
export function resolveSeedGcpConfig(env: NodeJS.ProcessEnv = process.env): SeedGcpConfig {
  const parsed = SeedGcpEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error(
      'Missing required GCP seed configuration. Set CLOUD_SQL_INSTANCE, DB_USER, and DB_NAME explicitly for the seed job.',
    );
  }
  return {
    instanceConnectionName: parsed.data.CLOUD_SQL_INSTANCE,
    user: parsed.data.DB_USER,
    database: parsed.data.DB_NAME,
  };
}

/**
 * Builds the `pg` client configuration for Cloud SQL private-IP + IAM auth.
 */
export async function buildSeedClientConfig(config: SeedGcpConfig): Promise<ClientConfig> {
  const cloudSqlOptions = await buildCloudSqlOptions({
    instanceConnectionName: config.instanceConnectionName,
    username: config.user,
    database: config.database,
  });

  return {
    user: config.user,
    database: config.database,
    ...(cloudSqlOptions.extra ?? {}),
  } satisfies ClientConfig;
}

async function main(): Promise<void> {
  if (process.argv.includes('--help')) {
    console.log('GCP Cloud SQL seed job');
    console.log('');
    console.log('Required environment variables: CLOUD_SQL_INSTANCE, DB_USER, DB_NAME');
    console.log('This command uses the Cloud Run Job service account and Cloud SQL IAM auth.');
    console.log('');
    console.log(formatSeedHelp());
    return;
  }

  const config = resolveSeedGcpConfig();
  const options = parseSeedOptions(process.argv.slice(2));
  const dataset = buildMockSeedDataset(options);
  const client = new Client(await buildSeedClientConfig(config));

  await client.connect();

  try {
    console.log(
      [
        `☁️ Seeding Cloud SQL instance '${config.instanceConnectionName}'`,
        `Database: ${config.database}`,
        `User: ${config.user}`,
        `Profile: ${options.profile}`,
        `Seed: ${options.seed}`,
      ].join('\n'),
    );
    await truncateSeedData(client);
    await seedDatabase(client, dataset);
    console.log(formatSeedSummary(dataset));
  } finally {
    await client.end();
  }
}

const isEntrypoint =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isEntrypoint) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

