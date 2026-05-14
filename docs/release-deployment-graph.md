# Release Deployment Graph

This document is the operator-facing runbook for the repository's full release graph,
from validated source changes to a seeded Cloud SQL database and deployed Cloud Run services.

## Graph

```mermaid
flowchart TD
    A[Push / PR] --> B[GitHub Actions: CI]
    B --> B1[Static checks]
    B --> B2[Seed/bootstrap smoke]
    B --> B3[Unit tests]
    B --> B4[Integration tests]
    B --> B5[Build]
    B --> B6[Docs artifact]

    B -->|main success| C[GitHub Actions: Publish docs]
    C --> C1[Generate TypeDoc]
    C1 --> C2[Deploy GitHub Pages]

    B -->|develop/main success or manual| D[GitHub Actions: Deploy to GCP]
    D --> D1[Validate GitHub Environment vars]
    D --> D2[OIDC auth to GCP]
    D --> D3[Submit cloudbuild.yaml]

    D3 --> E[Cloud Build: secret scan]
    E --> F[Install deps]
    F --> G[Lint]
    G --> H[Typecheck]
    H --> I[Unit tests]
    I --> J[Integration tests]
    J --> K[E2E tests]
    K --> L[Build and push images]
    L --> M[Cloud Run Job: migrate Cloud SQL]
    M --> N[Cloud Run Job: seed Cloud SQL]
    N --> O[Deploy API]
    O --> P[API health smoke]
    P --> Q[Seeded login smoke \(staging only\)]
    Q --> R[Deploy web]
    R --> S[Web smoke]
    S --> T[Environment ready]
```

## Environment behavior

### Staging

Automatic deploys from successful `CI` runs on `develop` and `main` target the `staging`
GitHub Environment and submit `_SEED_PROFILE=demo`.

That means the normal staging graph is:

1. validate and test in GitHub Actions
2. run the full Cloud Build pipeline
3. migrate Cloud SQL
4. seed Cloud SQL with the deterministic `demo` dataset
5. deploy the API
6. verify `/api/health`
7. verify the seeded admin can log in
8. deploy the web service
9. verify the deployed web frontend responds

### Production

Production deploys are manual only.

Default safe path:

- `environment=production`
- `confirm_production=deploy`
- `seed_profile=none`

Seeded production bootstrap path:

- `environment=production`
- `confirm_production=deploy`
- `seed_profile=demo|mocker|load`
- `confirm_seeded_production=seed-production`

The additional confirmation is required so production seeding is always an explicit,
intentional operation.

## Required GCP configuration

The deploy graph depends on these pieces being configured first:

- Terraform applied from `infra/`
- Secret Manager versions populated for:
  - `JWT_SECRET`
  - `SENDGRID_API_KEY`
  - `EMAIL_FROM`
- GitHub Environment variables populated for the selected environment
- Cloud SQL connection name available as `GCP_CLOUD_SQL_INSTANCE`

The Cloud SQL seed job uses the API workload identity and requires the real:

- `CLOUD_SQL_INSTANCE`
- `DB_USER`
- `DB_NAME`

It intentionally does **not** use the local seeder defaults.

## Seeded credentials used in staging verification

The staging seeded-login smoke check verifies the curated admin account from the
seed dataset:

- national ID: `000000018`
- password: `Admin1!23`

That check proves the seeded database is not only reachable, but also usable by the app.

## Related documents

- `docs/github-workflows.md`
- `docs/gcp-onboarding.md`
- `docs/seeding.md`
- `infra/README.md`

