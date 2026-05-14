# Developer Guide

This repository is prepared for long-term maintenance by a new owner. The goal is:

- predictable local setup
- explicit architecture boundaries
- generated API reference documentation
- documented transfer steps for a new GitHub owner and GCP project

## Documentation layers

### Markdown guides

Use the Markdown documents under `docs/` for workflows and operational guidance:

- `docs/publishing-to-new-owner.md` — GitHub/GCP transfer flow
- `docs/seeding.md` — local seeding profiles and examples
- `infra/README.md` — Terraform responsibilities and required APIs

### Docstrings → HTML reference docs

The TypeScript codebase includes JSDoc comments on the main integration points. Generate HTML docs with:

```bash
npm install
npm run docs:api
```

The output is written to `docs/reference/html/`.

## Architectural map

### `apps/api/`

The backend follows onion architecture:

- `domain/` — pure business rules and entities
- `application/` — use cases and port interfaces
- `infrastructure/` — persistence, auth, email, GCP, scheduler implementations
- `interfaces/` — HTTP controllers, middleware, and routes
- `composition/` — dependency registration
- `scripts/` — operator tooling such as seeding and GCP bootstrap

### `apps/web/`

The frontend is feature-oriented:

- `features/` — page and domain-specific UI
- `app/` — route composition, store, hooks, auth/access helpers
- `shared/` — layout, i18n, reusable UI utilities

### `packages/shared/`

Shared enums, Zod schemas, and DTO types used by both the API and the web app.

## Documentation conventions

When adding new public-facing modules or integration points:

1. add a short JSDoc block to exported functions, classes, or constants
2. update the relevant Markdown guide under `docs/`
3. prefer documenting workflows near the repo root only when they are first-day entry points
4. keep transfer- or infra-heavy details in `docs/` or `infra/README.md`

## Recommended maintenance workflow

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run docs:api
```

For deeper verification, also run integration and end-to-end tests when Docker and browsers are available.
