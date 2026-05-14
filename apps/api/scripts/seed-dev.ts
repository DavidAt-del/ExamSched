/**
 * Local database seeder.
 *
 * The script keeps the familiar demo accounts while also supporting richer,
 * deterministic mock-data generation for QA and stakeholder walkthroughs.
 *
 * Examples:
 *   npm run seed:demo --workspace @app/api
 *   npm run seed:mocker --workspace @app/api -- --seed 42 --extra-proctors 30
 *   npx tsx scripts/seed-dev.ts --profile load --open-exams 24
 */
import { Client } from 'pg';
import {
  buildMockSeedDataset,
  formatSeedHelp,
  formatSeedSummary,
  parseSeedOptions,
  seedDatabase,
  truncateSeedData,
} from './seed/index.js';

/**
 * Connects to the configured local PostgreSQL instance and applies the selected
 * seed profile.
 */
async function main(): Promise<void> {
  if (process.argv.includes('--help')) {
    console.log(formatSeedHelp());
    return;
  }

  const options = parseSeedOptions(process.argv.slice(2));
  const dataset = buildMockSeedDataset(options);
  const client = new Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? 'app',
    password: process.env.DB_PASSWORD ?? 'app',
    database: process.env.DB_NAME ?? 'proctor_scheduler',
  });

  await client.connect();

  try {
    console.log(`🧪 Seeding profile '${options.profile}' with Faker seed ${options.seed}...`);
    await truncateSeedData(client);
    await seedDatabase(client, dataset);
    console.log(formatSeedSummary(dataset));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

