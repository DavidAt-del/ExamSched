# Proctor Scheduler — מערכת שיבוץ משגיחים

Automated exam-proctor scheduling system. Replaces a manual Google Form → Excel → manual-assignment workflow with a Hebrew/RTL web app and a Node.js API.

## Stack

- **Backend** — Node 22 / TypeScript / Express / TypeORM / PostgreSQL 17 / tsyringe / Zod / pino
- **Frontend** — Vite / React 18 / Redux Toolkit + RTK Query / React Router / Tailwind (RTL) / FullCalendar / i18next
- **Infra** — Cloud Run + Cloud SQL (private IP, IAM auth) + Secret Manager + Artifact Registry + Cloud Build, defined in Terraform

## Repo layout

```
proctor-scheduler/
├── apps/
│   ├── api/          # backend, onion architecture
│   └── web/          # frontend, feature-first
├── docs/
│   └── archive/      # historical bootstrap + audit handoff notes
├── packages/
│   └── shared/       # Zod schemas + DTO types shared by both apps
├── infra/            # Terraform (Cloud Run, Cloud SQL, Secret Manager, IAM)
├── cloudbuild.yaml
├── docker-compose.yml
└── tsconfig.base.json
```

## Local development

```bash
# Start Postgres (Docker Desktop / Docker Engine on any OS)
docker compose up -d postgres

# Install workspaces
npm install

# Seed a realistic demo dataset
npm run seed:demo

# Or create a larger deterministic mock dataset
npm run seed:mocker

# Run API + web together from the repo root
npm run dev:demo

# Or start them separately from the repo root
npm run dev:api
npm run dev:web
```

The Vite dev server proxies `/api` to `http://localhost:8080`.

Demo logins use **national ID** (not email):

| Role       | National ID | Password    |
| ---------- | ----------- | ----------- |
| Admin      | `000000018` | `Admin1!23` |
| Exam Staff | `000000026` | `Staff1!23` |
| Proctor    | `000000034` | `123456`    |
| Proctor    | `000000042` | `Pass1!23`  |
| Proctor    | `000000050` | `Noa1!23`   |
| Proctor    | `000000068` | `Amir1!23`  |

`npm run dev:demo` is a small Node launcher (`scripts/dev-demo.mjs`) so it
works the same on Linux, macOS, and Windows.

Advanced seeding flags are documented in `docs/seeding.md`.

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration   # requires Docker for Testcontainers
npm run docs:api           # generates HTML docs in docs/reference/html/
```

## Architecture

- **API** uses onion architecture: `domain → application → (infrastructure | interfaces) → composition`. ESLint enforces dependency direction with `no-restricted-imports`.
- **Web** uses a single RTK Query `createApi` instance with feature-injected endpoints. Server state lives in the RTK Query cache; `*Slice` files only hold UI/auth state.
- **Hebrew/RTL** is the default. The HTML element ships with `dir="rtl"` and `lang="he"`. All user-facing strings live in `apps/web/src/shared/i18n/he.json`.

Historical implementation notes live under `docs/archive/`, including
`docs/archive/BOOTSTRAP_REPORT.md`.

## Documentation

- `docs/developer-guide.md` — maintainer guide and architecture map
- `docs/github-workflows.md` — GitHub Actions, Pages, and GCP deployment workflow setup
- `docs/gcp-onboarding.md` — step-by-step GCP bootstrap using your own `gcloud` credentials
- `docs/public-release-checklist.md` — final pre-publication checklist for a new owner
- `docs/release-deployment-graph.md` — end-to-end CI → seeded GCP DB → Cloud Run deployment runbook
- `docs/seeding.md` — deterministic mock-data seeding profiles
- `docs/publishing-to-new-owner.md` — GitHub + GCP transfer workflow
- `CONTRIBUTING.md` — contributor workflow and repo expectations
- `SECURITY.md` — security reporting and secret-handling guidance

Generate HTML API/reference docs from JSDoc comments with:

```bash
npm run docs:api
```

Built-in GitHub workflows now cover CI validation, GitHub Pages publication for
the generated TypeDoc site, and manual GCP deployment orchestration. See
`docs/github-workflows.md` for the full setup.

## GCP onboarding for a new owner

Use the repository bootstrap command to generate local `infra/terraform.tfvars`
and `cloudbuild.substitutions.local.yaml` from your authenticated `gcloud`
context or explicit CLI flags:

```bash
npm run setup:gcp -- --project-id your-gcp-project-id
```

Add `--enable-apis` to automatically enable the required Google APIs in the
target project.

For repository transfer and deployment into a different GCP project, see
`docs/publishing-to-new-owner.md`.
