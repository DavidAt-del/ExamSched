# Seeding Guide

The API ships with a deterministic seeding pipeline that can produce either a compact demo dataset or larger mock-data scenarios.

## Commands

From the repository root:

```bash
npm run seed:demo
npm run seed:mocker
```

Direct API workspace usage:

```bash
npm --workspace @app/api run seed:demo
npm --workspace @app/api run seed:mocker -- --seed 42 --extra-proctors 30
```

## Profiles

### `demo`

Small curated dataset for product walkthroughs.

Includes:

- fixed admin and exam-staff credentials
- fixed proctor accounts used by existing demos/tests
- open, scheduled, sent, and closed exam periods
- audit log, availability, assignments, and notification history

### `mocker`

Richer local dataset that keeps the curated users but adds deterministic fake staff, proctors, exams, and scheduler artifacts.

Best for:

- UI QA
- screenshot generation
- testing pagination or denser lists
- trying scheduling flows with more realistic data volumes

### `load`

A heavier dataset for local stress-testing without changing application code.

## Useful flags

```bash
npm --workspace @app/api run seed:demo -- --help
npm --workspace @app/api run seed:mocker -- --seed 20260514
npm --workspace @app/api run seed:mocker -- --extra-proctors 40 --open-exams 12
npm --workspace @app/api run seed:mocker -- --notification-failure-rate 0.2
```

Supported options:

- `--profile <demo|mocker|load>`
- `--seed <number>`
- `--extra-staff <number>`
- `--extra-proctors <number>`
- `--open-exams <number>`
- `--scheduled-exams <number>`
- `--sent-exams <number>`
- `--closed-exams <number>`
- `--generated-password <password>`
- `--availability-rate <0..1>`
- `--notification-failure-rate <0..1>`
- `--manual-override-rate <0..1>`

## Local database environment

The seeder uses the same environment variables as the API:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Defaults match `apps/api/.env.example`, so the standard Docker Compose PostgreSQL setup works out of the box.

## GCP / Cloud SQL seeding

The deployment pipeline also supports a dedicated Cloud SQL seed job for GCP.
It runs inside a Cloud Run Job and uses the workload's existing service-account
credentials plus Cloud SQL IAM auth.

Command path inside the deployed API image:

```bash
npx tsx apps/api/scripts/seed-gcp.ts --profile demo
```

Required environment variables for the GCP seed path:

- `CLOUD_SQL_INSTANCE`
- `DB_USER`
- `DB_NAME`

Unlike the local seeder, the GCP seed job does **not** fall back to localhost,
`app`, or password defaults. The Cloud Build / Cloud Run job must pass the real
Cloud SQL connection name and IAM database user explicitly.

In the checked-in deployment graph:

- `develop` / `main` automatic staging deploys pass `_SEED_PROFILE=demo`
- manual deploys can choose `none`, `demo`, `mocker`, or `load`
- production deploys require an extra explicit confirmation before using any
  non-`none` seed profile
- staging seeded deploys also run a smoke check that logs in with the seeded
  admin account to verify the loaded dataset is actually usable
- production should normally use `none` unless you are intentionally performing
  a controlled bootstrap load

## Determinism

Generated data is driven by Faker with a numeric seed. If you reuse the same `--seed` and the same options, the resulting dataset shape will be the same.

That makes the seeder suitable for:

- reproducible QA bugs
- shared review environments
- stable screenshots for docs or demos
