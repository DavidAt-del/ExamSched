# Contributing

This repository is intended to be easy for a new maintainer or external contributor to pick up quickly.

## First-time setup

```bash
docker compose up -d postgres
npm install
npm run seed:demo
npm run dev:demo
```

The local web app runs on `http://localhost:5173` and proxies API traffic to `http://localhost:8080`.

## Helpful docs

- `README.md` — product-facing setup and architecture summary
- `docs/developer-guide.md` — maintainer-facing architecture map and doc conventions
- `docs/seeding.md` — deterministic mock-data seeding profiles
- `docs/gcp-onboarding.md` — GCP bootstrap for a new owner or project
- `docs/publishing-to-new-owner.md` — transfer guide for GitHub + GCP

## Development workflow

### Run the main quality gates

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
```

### Optional deeper checks

```bash
npm run test:integration
npm --workspace @app/web run test:e2e
npm run docs:api
```

## Documentation expectations

When you add or change behavior:

1. update relevant JSDoc comments on exported integration points
2. update the appropriate Markdown guide under `docs/`
3. keep root docs short and product-facing
4. place operational details in `docs/` or `infra/README.md`

## Seeding and demos

Use the curated dataset for quick demos:

```bash
npm run seed:demo
```

Use the richer deterministic dataset for QA or screenshots:

```bash
npm run seed:mocker
```

For advanced flags, see `docs/seeding.md`.

## Infrastructure and GCP changes

If your change affects deployment or transfer behavior:

1. update Terraform under `infra/`
2. update `cloudbuild.yaml` if CI/CD inputs changed
3. update `docs/gcp-onboarding.md` and `docs/publishing-to-new-owner.md`
4. verify `npm run setup:gcp -- --dry-run --project-id demo-project`

## Pull request guidance

Before opening a PR, make sure:

- tests relevant to the change have been run locally
- docs are updated when behavior or onboarding changes
- seeded/demo flows still work when user-facing functionality changes
- no secrets, personal paths, or account-specific identifiers were added to tracked files

