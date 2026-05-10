# Bootstrap Report

Generated as part of the initial scaffolding of the proctor scheduling system.

## 1. File tree

```
.
├── BOOTSTRAP_REPORT.md
├── README.md
├── .editorconfig
├── .dockerignore
├── .gitignore
├── .nvmrc                       # node 22
├── .prettierrc.json
├── cloudbuild.yaml
├── docker-compose.yml
├── eslint.config.js             # root flat config
├── package.json                 # workspaces: apps/*, packages/*
├── package-lock.json
├── tsconfig.base.json
│
├── apps/
│   ├── api/
│   │   ├── Dockerfile
│   │   ├── eslint.config.js     # adds onion-boundary no-restricted-imports
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   ├── vitest.config.ts
│   │   ├── .env.example
│   │   ├── src/
│   │   │   ├── main.ts          # bootstrap (env → DS → migrations → DI → app.listen)
│   │   │   ├── config/env.ts
│   │   │   ├── domain/
│   │   │   │   ├── entities/
│   │   │   │   │   ├── Assignment.ts
│   │   │   │   │   ├── Availability.ts
│   │   │   │   │   ├── Exam.ts
│   │   │   │   │   ├── ExamPeriod.ts
│   │   │   │   │   ├── Proctor.ts
│   │   │   │   │   └── User.ts
│   │   │   │   ├── errors/DomainError.ts
│   │   │   │   ├── services/SchedulerDomainService.ts
│   │   │   │   └── value-objects/
│   │   │   │       ├── DateRange.ts
│   │   │   │       ├── Email.ts
│   │   │   │       ├── NationalId.ts   # validates Israeli ID checksum
│   │   │   │       └── Phone.ts
│   │   │   ├── application/
│   │   │   │   ├── ports/
│   │   │   │   │   ├── repositories/{IUser,IExam,IExamPeriod,IAvailability}Repository.ts
│   │   │   │   │   ├── services/{IClock,IIdGenerator,IPasswordHasher,ITokenService,IEmailService,INotificationChannel}.ts
│   │   │   │   │   └── unit-of-work/IUnitOfWork.ts
│   │   │   │   └── use-cases/
│   │   │   │       ├── auth/{LoginUseCase,ChangePasswordUseCase}.ts
│   │   │   │       └── availability/{SubmitAvailabilityUseCase,ListExamsForProctorUseCase}.ts
│   │   │   ├── infrastructure/
│   │   │   │   ├── auth/{BcryptPasswordHasher,JwtTokenService}.ts
│   │   │   │   ├── email/SendgridEmailService.ts        # + NoopEmailService for dev
│   │   │   │   ├── gcp/{cloud-sql,secrets}.ts
│   │   │   │   ├── persistence/typeorm/
│   │   │   │   │   ├── data-source.ts
│   │   │   │   │   ├── entities/*.ts                    # 7 ORM entities
│   │   │   │   │   ├── mappers/*.ts                     # ORM ↔ Domain mappers
│   │   │   │   │   ├── migrations/1715000000000-Init.ts # full schema
│   │   │   │   │   └── repositories/TypeOrm*Repository.ts
│   │   │   │   ├── scheduler/GreedySchedulingEngine.ts  # v1 greedy assigner
│   │   │   │   └── system/{SystemClock,UuidIdGenerator}.ts
│   │   │   ├── interfaces/http/
│   │   │   │   ├── app.ts
│   │   │   │   ├── controllers/{Auth,Availability}Controller.ts
│   │   │   │   ├── middleware/{auth,errorHandler,requestId}.ts
│   │   │   │   └── routes/index.ts
│   │   │   └── composition/container.ts                 # tsyringe registrations
│   │   └── test/
│   │       ├── setup.ts                                 # imports reflect-metadata
│   │       ├── unit/
│   │       │   ├── domain/{NationalId,User,SchedulerDomainService}.test.ts
│   │       │   └── use-cases/{Login,SubmitAvailability}UseCase.test.ts
│   │       ├── integration/
│   │       │   ├── setup.ts                             # Testcontainers PG
│   │       │   └── TypeOrmUserRepository.test.ts
│   │       └── e2e/auth-and-availability.test.ts        # supertest + DB
│   │
│   └── web/
│       ├── Dockerfile
│       ├── nginx.conf
│       ├── eslint.config.js
│       ├── index.html                                   # <html dir="rtl" lang="he">
│       ├── package.json
│       ├── postcss.config.js
│       ├── public/manifest.webmanifest                  # PWA manifest
│       ├── tailwind.config.ts                           # tailwindcss-rtl plugin
│       ├── tsconfig.json
│       ├── tsconfig.build.json
│       ├── vite.config.ts                               # /api proxy → :8080
│       ├── src/
│       │   ├── index.css
│       │   ├── main.tsx
│       │   ├── app/
│       │   │   ├── api.ts            # single createApi base slice
│       │   │   ├── hooks.ts          # useAppDispatch / useAppSelector
│       │   │   ├── routes.tsx
│       │   │   ├── store.ts
│       │   │   └── store-types.ts
│       │   ├── features/
│       │   │   ├── auth/
│       │   │   │   ├── authApi.ts             # injectEndpoints
│       │   │   │   ├── authSlice.ts           # token + user (sessionStorage)
│       │   │   │   └── pages/LoginPage.tsx
│       │   │   └── availability/
│       │   │       ├── availabilityApi.ts
│       │   │       └── pages/ProctorCalendarPage.tsx   # FullCalendar RTL
│       │   └── shared/
│       │       ├── i18n/{he.json,en.json,index.ts}
│       │       └── layouts/AppLayout.tsx
│       └── test/
│           ├── setup.ts
│           ├── authSlice.test.ts
│           └── LoginPage.test.tsx
│
├── packages/
│   └── shared/
│       ├── package.json                                 # main: dist/index.js
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── domain-enums/index.ts                    # UserRole, ProctorType, etc.
│           ├── dtos/index.ts
│           └── schemas/{auth,availability,errors,index}.ts
│
└── infra/
    ├── README.md
    ├── main.tf
    ├── cloud-run.tf
    ├── cloud-sql.tf
    ├── iam.tf
    └── secrets.tf
```

## 2. Local commands

```bash
# Install everything
nvm use                                # node 22
npm install

# Build the shared package once (npm install runs this automatically via "prepare")
npm run build --workspace @app/shared

# Start Postgres
docker compose up -d postgres

# Run API in dev (auto-runs migrations on boot)
npm run dev:api                        # http://localhost:8080
# Run web
npm run dev:web                        # http://localhost:5173 (proxies /api)

# Quality gates
npm run lint
npm run typecheck
npm run test:unit                      # 25 + 4 = 29 tests
npm run test:integration               # requires Docker daemon
```

### Validation results captured during bootstrap

| Gate                          | Status                                                                |
|-------------------------------|-----------------------------------------------------------------------|
| `npm install`                 | ✅ 842 packages                                                        |
| `npm run typecheck`           | ✅ all three workspaces clean                                          |
| `npm run lint`                | ✅ flat config + onion `no-restricted-imports`, all clean              |
| `npm run test:unit` (api)     | ✅ 25 tests pass — domain VOs, entities, scheduler service, use cases  |
| `npm run test` (web)          | ✅ 4 tests pass — auth slice + LoginPage rendering                     |
| `npm run build` (api)         | ✅ tsc emits to `apps/api/dist/main.js`                                |
| `npm run build` (web)         | ✅ Vite emits 643 kB JS / 7.8 kB CSS / 0.9 kB HTML                    |
| `npm run test:integration`    | ⚠️ skipped — no Docker daemon in this sandbox; ready for CI/local      |
| `npm run test:e2e`            | ⚠️ same as above                                                       |

## 3. Cloud Run URLs

Not deployed yet. Cloud Run service URLs become available after the first successful Cloud Build run; Terraform exposes them as outputs `api_url` and `web_url` (see `infra/cloud-run.tf:111-117`).

## 4. Secrets to populate in Secret Manager

| Secret name (per environment)            | Used for                                                                         |
|------------------------------------------|----------------------------------------------------------------------------------|
| `proctor-<env>-jwt-secret`               | Symmetric JWT signing key (HS256). Min 32 bytes random, rotate every 90 days.    |
| `proctor-<env>-sendgrid-api-key`         | SendGrid API key for proctor schedule email notifications.                       |
| `proctor-<env>-email-from`               | Sender address for outbound mail (e.g. `no-reply@proctor.example.ac.il`).        |

Populate via `gcloud secrets versions add proctor-<env>-jwt-secret --data-file=<file>`. The Cloud Run service binds them as `JWT_SECRET`, `SENDGRID_API_KEY`, `EMAIL_FROM` env vars.

For database credentials there is no secret to manage: the API authenticates to Cloud SQL via Cloud SQL Connector with IAM auth (`@google-cloud/cloud-sql-connector`), using the API service account (`api-<env>@<project>.iam.gserviceaccount.com`).

## 5. Deviations from the prompt

1. **`prepare` script on `@app/shared`.** The prompt didn't specify a build pipeline for the shared package, but because both apps and the runtime resolve `@app/shared` through Node module resolution, shared must emit JS to `dist/`. I added a `prepare` script so `npm install` builds shared automatically — no manual build step before first run. Imports during dev still go through the workspace symlink and tsx loader.

2. **`NoopEmailService`.** The prompt called for SendGrid only, but for local dev (no API key) the boot path needed to succeed. I wired a no-op email service that engages when `SENDGRID_API_KEY` is unset, so `npm run dev:api` works without external credentials. The DI registration in `composition/container.ts` picks one or the other.

3. **`ListExamsForProctorUseCase`.** Not explicitly listed in the prompt's use-case enumeration, but the Hebrew calendar in §6 needs server-side data to render the proctor's exam list with their current availability flag. Added it as a thin read use case rather than denormalising into the submit endpoint.

4. **No FullCalendar e2e (Playwright).** The prompt's first iteration §6 says "supertest e2e for login + submit flow" — done. A browser-driven e2e (Playwright/Cypress) would belong in a separate slice; I left placeholders rather than scaffolding a full Playwright config.

5. **Onion ESLint rules.** I used `no-restricted-imports` with **path patterns** (e.g., `**/infrastructure/**`) rather than the prompt's example `*/infrastructure/*`. ESLint's `no-restricted-imports` matches `import` strings, not filesystem paths, so the patterns target the relative-import strings that show up in source. Tested: a deliberate cross-layer import surfaces as an ESLint error.

6. **`NationalIdHydrate` mapper helper.** The strict check-digit validation in `NationalId.create` would reject any historical row with a malformed ID. Rather than skip validation in the VO, the mapper hydrates via the same VO and surfaces a clear error if a stored row is invalid. Documented inline.

7. **`tsconfig` `rootDir` adjustments.** Default TypeScript `rootDir` semantics conflict with cross-workspace path mapping under strict settings. The dev tsconfigs omit `rootDir` (allowing `noEmit` typecheck to span the workspace via the shared package); only the build tsconfig pins `rootDir: ./src` and relies on the published shared package for its types and runtime imports.

8. **Stricter password rules deferred.** Per spec there are no complexity rules for proctor passwords. The Zod schema enforces only `min(6)` for the new password during change, matching the spec's "no complexity" stance.

## 6. Acceptance against the prompt's hard rules

| Rule                                                              | Status |
|-------------------------------------------------------------------|--------|
| No `synchronize: true` on TypeORM                                 | ✅ — `synchronize: false` hard-coded in `data-source.ts` |
| No `any` in `domain/` or `application/`                           | ✅ — only `unknown`/narrowed types appear |
| No HTTP types outside `interfaces/http/`                          | ✅ — Express types only in interfaces |
| No TypeORM imports outside `infrastructure/persistence/`          | ✅ — enforced by ESLint pattern |
| No Redux server-state duplication                                 | ✅ — `authSlice` only stores token + user; lists live in RTK Query cache |
| No string concatenation for SQL                                   | ✅ — QueryBuilder + repository methods only |
| `timestamptz` everywhere; ISO-8601 over the wire                  | ✅ — migration uses `timestamptz`; controllers serialize via `toISOString()` |
| All user-facing strings via i18next                               | ✅ — components read keys, no inline Hebrew/English in JSX |

## 7. Out of scope (deferred per prompt §8)

- Full constraint solver (OR-Tools). Greedy v1 in place.
- SMS notification channel (`INotificationChannel` port defined, no adapter).
- Special-needs classroom logic (manual override path only).

## 8. Shipped state (mission accomplished)

Everything below ships across PRs #1–7 and closes the project against the
original bootstrap prompt + the Phase 2–7 implementation handoff. Read
this section first if you're picking up the codebase fresh.

### Merged PRs

| #  | Phase            | Headline                                                                |
|----|------------------|-------------------------------------------------------------------------|
| 1  | Bootstrap        | Workspaces, onion API, vertical slice (login + submit availability).    |
| 2  | Review fixes     | Auth/UserMapper/UI a11y polish from Copilot review.                     |
| 3  | Phase 2          | Admin panel: proctor + exam-period CRUD + Excel/CSV import.             |
| 4  | Phase 3          | Scheduler engine, manual override drawer, schedule view + Excel export. |
| 5  | Phase 4 + 5      | Notifications (`SendSchedulesUseCase` + email builder), proctor side.   |
| 6  | Phase 6 + 7      | Audit log read view, staff password reset, retroactive audit calls,     |
|    |                  | PWA service worker.                                                     |
| 7  | Phase 8          | Mission completion: change-password page (P0), CI integration tests +   |
|    |                  | gitleaks, PWA PNG icons, this section.                                  |

### End-to-end flow that now works

1. **Admin** creates exam-staff users and proctors (manually or via Excel
   import) and resets passwords when needed.
2. **Exam staff** open a period with a deadline, add exams, set
   `classroomCount`. Closing the period locks proctors out.
3. **Proctors** sign in (default password `123456`, forced change on
   first login), mark availability per exam, then click `שלח` to
   finalize. Past the deadline / closed period, finalize returns 423.
4. **Exam staff** run the greedy scheduler, optionally override individual
   classrooms, send the schedule (per-recipient checklist), and export to
   `.xlsx` with one sheet per exam date (RTL-formatted).
5. **Proctors** see the read-only "השיבוץ שלי" tab once the schedule is
   sent, with classroom + partner name per assignment.
6. **Anyone with admin / exam-staff role** can browse the **audit log**
   (paginated, date-range filter) covering: proctor lifecycle events,
   password resets, scheduler runs, manual overrides, and schedule sends.

### Quality gates on `main`

```bash
npm run typecheck     # ✅ all three workspaces
npm run lint          # ✅ incl. onion no-restricted-imports
npm run test:unit     # ✅ 114 API tests, 6 web tests
npm run build         # ✅ both apps (web build:icons regenerates PNGs)
```

CI pipeline (`cloudbuild.yaml`) gates each push:
`install → secret-scan (gitleaks) → lint → typecheck → test:unit →
test:integration (Testcontainers) → build images → migrate → deploy`.

### PWA

- App installs from Chrome / Edge / Safari with both the SVG vector icon
  (PWA install prompt + Android maskable) and a 192/512 PNG pair.
- iOS Safari "Add to Home Screen" uses `apple-touch-icon.png` (180×180,
  pre-flattened on the brand slate-900).
- `apps/web/public/service-worker.js` handles cache-first for the app
  shell + Vite-hashed assets and network-first for `/api/*`.
  Bump `CACHE_VERSION` in that file when shipping a breaking change.
- All three PNG icons rasterize from `apps/web/public/icon.svg` via
  `apps/web/scripts/build-icons.mjs` (chained into `npm run build`).
  Replacing the source SVG and re-running `npm run build:icons` updates
  every output deterministically.

### Audit pass against original requirements

The Phase 8 audit checked the codebase against every quality gate from
the bootstrap prompt §7 and every must-do bullet from the Phase 2–7
handoff. Result:

| Gate                                                      | Status |
|-----------------------------------------------------------|--------|
| `tsc --noEmit` clean                                      | ✅      |
| ESLint clean (incl. onion `no-restricted-imports`)        | ✅      |
| Unit tests green                                          | ✅ 114 |
| Integration test gate                                     | ✅ wired in CI (Phase 8B) |
| Migration round-trip                                      | ✅ scripts in `apps/api/package.json`; CI runs forward path |
| Secret-scan gate                                          | ✅ gitleaks step (Phase 8C) |
| Container vuln scan                                       | ⚠️ relies on Artifact Registry's automatic scan post-push |
| First-time proctor flow (`/change-password`)              | ✅ page + route shipped (Phase 8A) |
| PWA PNG icons (192 / 512 / Apple)                         | ✅ Phase 8D |

### Explicit non-goals retained from the original handoff

- **Admin (root) password reset path** — only proctor + exam-staff resets
  ship; admin reset goes through a separate (out-of-scope) flow.
- **OR-Tools / ILP scheduler** — the greedy v1 stays. Add an alternative
  `ISchedulingEngine` adapter + DI swap when real-data fairness demands it.
- **SMS channel** — `INotificationChannel` is defined for completeness;
  no adapter ships.
- **Special-needs / accommodation classrooms** — handled exclusively
  through the manual-override drawer.
- **Native mobile app** — covered by the PWA install path.
