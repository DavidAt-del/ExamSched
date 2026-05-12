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
├── packages/
│   └── shared/       # Zod schemas + DTO types shared by both apps
├── infra/            # Terraform (Cloud Run, Cloud SQL, Secret Manager, IAM)
├── cloudbuild.yaml
├── docker-compose.yml
└── tsconfig.base.json
```

## Local development

```bash
# Start Postgres
docker compose up -d postgres

# Install workspaces
npm install

# Run API (with auto-migration on boot)
npm run dev:api

# Run web
npm run dev:web   # http://localhost:5173

# Seed a real-like demo dataset
npm run seed:demo --workspace @app/api
```

The Vite dev server proxies `/api` to `http://localhost:8080`.

Demo logins use **national ID** (not email):

| Role       | National ID | Password    |
|------------|-------------|-------------|
| Admin      | `000000018` | `Admin1!23` |
| Exam Staff | `000000026` | `Staff1!23` |
| Proctor    | `000000034` | `123456`    |
| Proctor    | `000000042` | `Pass1!23`  |
| Proctor    | `000000050` | `Noa1!23`   |
| Proctor    | `000000068` | `Amir1!23`  |

## Quality gates

```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration   # requires Docker for Testcontainers
```

## Architecture

- **API** uses onion architecture: `domain → application → (infrastructure | interfaces) → composition`. ESLint enforces dependency direction with `no-restricted-imports`.
- **Web** uses a single RTK Query `createApi` instance with feature-injected endpoints. Server state lives in the RTK Query cache; `*Slice` files only hold UI/auth state.
- **Hebrew/RTL** is the default. The HTML element ships with `dir="rtl"` and `lang="he"`. All user-facing strings live in `apps/web/src/shared/i18n/he.json`.

See `BOOTSTRAP_REPORT.md` for the bootstrap audit trail.
