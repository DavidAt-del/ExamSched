# Remaining Spec Compliance Gaps

Status as of commit `7d07611` on `main`. 9 of 15 audited gaps are closed
(PR A + partial PR B). This document tracks the 7 still-open items so the
next session can pick up cold.

This archived note originally referenced a local planning document that is
not part of the repository export. The ratified plan summary remains in the
body of this file.

---

## Quality gates — current baseline

After commit `7d07611`:

```bash
npm run typecheck     # ✅ 3 workspaces clean
npm run lint          # ✅ incl. onion no-restricted-imports
npm run test:unit     # ✅ 118 API + 6 web
```

Re-run these after each item below.

---

## B1 — Disable non-exam days in proctor calendar (S, frontend only)

**Spec §6.1** — non-exam days must be visibly greyed out and non-interactive.

**State:** `apps/web/src/features/availability/pages/ProctorHomePage.tsx`
uses default FullCalendar styling. Non-exam days look identical to
exam-empty days.

**Edit:** `apps/web/src/features/availability/pages/ProctorHomePage.tsx`
inside `PeriodPanel` component.

1. Memoise `const examDates = new Set(exams.map(e => e.examDate));`
2. Add a small `toISODate(d: Date): string` helper that produces
   local-time `YYYY-MM-DD` (FullCalendar's `arg.date` is local-tz —
   match the `examDate` strings the API returns).
3. Pass to `<FullCalendar>`:
   ```ts
   dayCellClassNames={(arg) =>
     examDates.has(toISODate(arg.date))
       ? []
       : ['bg-slate-100', 'text-slate-400', 'cursor-not-allowed']
   }
   selectAllow={() => false}
   ```
4. No new i18n keys.

**Tests:** extend `apps/web/e2e/proctor-availability.spec.ts` — assert a
non-exam-date cell has class `bg-slate-100` and clicking it produces no
mutation.

---

## B2 — Selected-dates panel: DD/MM/YYYY + all states (S, frontend only)

**Spec §6.3** — list all exam slots with `DD/MM/YYYY HH:MM–HH:MM` and a
state indicator (✓ / ✗ / – not chosen).

**State:**
`apps/web/src/features/availability/components/SelectedDatesPanel.tsx`
currently filters to `myAvailability === true`, formats dates as ISO
`YYYY-MM-DD`, and shows no state pill.

**New helper:** `apps/web/src/shared/utils/formatDate.ts`
```ts
export function formatDDMMYYYY(iso: string): string {
  // iso = 'YYYY-MM-DD'
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
```
(dayjs is NOT in `apps/web/node_modules` — do not add a dep.)

**Edit:** `SelectedDatesPanel.tsx`
- Drop the `=== true` filter; render all exams sorted by date then time.
- For each row: `formatDDMMYYYY(e.examDate)` + `HH:MM–HH:MM` + state pill:
  - `true` → green ✓ `t('calendar.available')`
  - `false` → grey ✗ `t('calendar.unavailable')`
  - `null/undefined` → outline `t('proctor.selectedDates.notChosen')`
- Use unicode `✓` / `✗` (no new dep). RTL: `ms-*`/`me-*` classes.

**i18n keys (new):**
- `he.json`: `"proctor.selectedDates.notChosen": "טרם נבחר"`
- `en.json`: `"proctor.selectedDates.notChosen": "Not chosen"`

**Tests:** component test (vitest + RTL) with three exams (true / false
/ null) — assert format `DD/MM/YYYY`, three pill labels, sort order.

---

## B4 — Deactivate proctor: block only when scheduled/sent (S, backend)

**Spec §10.4** — block deactivation only when the user has future
assignments in a `scheduled` or `sent` period. Current implementation
blocks on any future assignment regardless of period status.

**Edit:**
`apps/api/src/infrastructure/persistence/typeorm/repositories/TypeOrmAssignmentRepository.ts`
`hasFutureForUser` method (lines 47-56). Replace with:

```ts
const count = await this.repo
  .createQueryBuilder('a')
  .innerJoin(ExamOrmEntity, 'e', 'e.id = a.exam_id')
  .innerJoin(ExamPeriodOrmEntity, 'ep', 'ep.id = e.period_id')
  .where('(a.opener_user_id = :userId OR a.regular_user_id = :userId)', { userId })
  .andWhere('e.exam_date >= :isoDate', { isoDate })
  .andWhere('ep.status IN (:...statuses)', { statuses: ['scheduled', 'sent'] })
  .getCount();
```

Import `ExamPeriodOrmEntity` from `../entities/ExamPeriodOrmEntity.js`.

**Tests:** new integration test
`apps/api/test/integration/TypeOrmAssignmentRepository.test.ts` — seed
three scenarios (open / closed / scheduled), all with future assignments;
assert `hasFutureForUser` returns `false, false, true`.

---

## B5 — Audit log admin-only access (S, backend + frontend)

**Spec §13.1** — admin-only view. Currently the route inherits the
broader `[Admin, ExamStaff]` middleware.

**Edits:**

1. `apps/api/src/interfaces/http/routes/index.ts:76` — narrow the audit-log
   route:
   ```ts
   admin.get('/audit-log', requireRole(UserRole.Admin), wrap(AdminController.listAuditLog));
   ```
   The middleware composes additively (verified in
   `middleware/auth.ts:38-50`).

2. `apps/web/src/shared/layouts/AppLayout.tsx` — render the audit-log
   nav `<NavLink>` only when `user?.role === UserRole.Admin`.

3. `apps/web/src/app/routes.tsx` — narrow the `RequireRole` for
   `admin/audit-log` from `[Admin, ExamStaff]` to `[Admin]`.

**Tests:** extend `apps/web/e2e/admin-users-audit.spec.ts` — log in as
exam_staff, assert direct API call returns 403 and the nav link is
hidden.

---

## B8 — Scheduler variance minimisation (M, backend)

**Spec §7.2** — minimise variance over the available pool. Current
greedy pre-sorts once and `.shift()`s; that approximates fairness but
doesn't re-sort as counts change.

**Edit:**
`apps/api/src/infrastructure/scheduler/GreedySchedulingEngine.ts`. Replace
the pre-sort + `.shift()` with per-pick min selection:

```ts
const pickMin = (pool: Proctor[], shifts: ReadonlyMap<string, number>): Proctor | undefined => {
  if (pool.length === 0) return undefined;
  let bestIdx = 0;
  let bestCount = shifts.get(pool[0]!.userId) ?? 0;
  for (let i = 1; i < pool.length; i += 1) {
    const c = shifts.get(pool[i]!.userId) ?? 0;
    // Tie-break: lexicographic userId for deterministic test fixtures.
    if (c < bestCount || (c === bestCount && pool[i]!.userId < pool[bestIdx]!.userId)) {
      bestIdx = i;
      bestCount = c;
    }
  }
  return pool.splice(bestIdx, 1)[0];
};
```

Iterate classrooms; for each, `pickMin(openers, shifts)`, then
`pickMin(regulars, shifts) ?? pickMin(openers, shifts)` for the partner;
increment `shifts` after each pick.

**Tests:**
- Integration: 4 exams × 2 classrooms × 4 openers (all available
  everywhere). Assert each opener gets 1 or 2 shifts (variance ≤ 1).
- Unit: contrived `shiftsByProctor` confirms min-pick order.

---

## C1 — ExamPeriod state-machine methods (M, backend refactor)

**Spec §4** — transitions should be enforced on the aggregate, not
scattered across use cases. Currently
`apps/api/src/domain/entities/ExamPeriod.ts` has plain mutable public
fields and three use cases mutate `period.status` directly.

**Edit:** `apps/api/src/domain/entities/ExamPeriod.ts`
- Convert `status` + `updatedAt` to private fields with getters.
- Add methods:
  - `close(now: Date)` — accept only from `Open`; idempotent on `Closed`.
  - `markScheduled(now: Date)` — accept from `Open | Closed | Scheduled`
    (re-runs are allowed); reject `Sent`.
  - `markSent(now: Date)` — accept only from `Scheduled`.
- Each sets `updatedAt = now`. Invalid transitions throw
  `InvariantViolationError` with a descriptive message.

**Refactor the three use cases** to call the new methods instead of
direct field assignment:
- `apps/api/src/application/use-cases/admin/exam-period/CloseExamPeriodUseCase.ts:37`
- `apps/api/src/application/use-cases/scheduling/RunSchedulerUseCase.ts:126`
- `apps/api/src/application/use-cases/notifications/SendSchedulesUseCase.ts:~193`

**Tests:**
- New `apps/api/test/unit/domain/ExamPeriod.test.ts` — table-driven
  transition matrix (every valid transition succeeds; every invalid one
  throws).
- Update the three existing use-case tests that assert on the post-status
  (they should keep passing since the happy paths are unchanged).

---

## C2 — Infra documentation update (XS, docs only)

**Spec §9.6 + §15** — `EMAIL_FROM` via Secret Manager. **Code is already
compliant** — `infra/secrets.tf:15-20` declares
`google_secret_manager_secret.email_from` and `infra/cloud-run.tf:70-78`
binds the env var via `value_source.secret_key_ref`. Only docs are stale.

**Edits:**
1. `infra/README.md` — add a row for `proctor-<env>-email-from` next to
   the `jwt-secret` and `sendgrid-api-key` rows.
2. `docs/archive/BOOTSTRAP_REPORT.md §4` — add the same row in the secrets table.
3. Verify (or add) `infra/iam.tf` grants the API service account
   `roles/secretmanager.secretAccessor` on the `email_from` secret.
   Cloud Run will fail to start otherwise.

No code changes. No tests.

---

## Suggested execution order for the remaining work

1. **B4** — pure-backend repo query change, simplest test.
2. **B5** — narrow auth gate + UI hide.
3. **B1 → B2** — frontend pair, share the small `formatDate` helper.
4. **B8** — scheduler fairness with fresh integration test.
5. **C2** — docs only, fast.
6. **C1** — domain refactor last (touches three use cases + their tests).

Aim to commit per-PR (one commit per gap or per logical pair) and re-run
the three quality gates before each commit.

---

## Critical files reference

**Backend**
- `apps/api/src/domain/entities/ExamPeriod.ts` — C1
- `apps/api/src/infrastructure/scheduler/GreedySchedulingEngine.ts` — B8
- `apps/api/src/infrastructure/persistence/typeorm/repositories/TypeOrmAssignmentRepository.ts` — B4
- `apps/api/src/interfaces/http/routes/index.ts` — B5
- `apps/api/src/application/use-cases/admin/exam-period/CloseExamPeriodUseCase.ts` — C1
- `apps/api/src/application/use-cases/scheduling/RunSchedulerUseCase.ts` — C1 (period.markScheduled call site)
- `apps/api/src/application/use-cases/notifications/SendSchedulesUseCase.ts` — C1 (period.markSent call site)

**Frontend**
- `apps/web/src/features/availability/pages/ProctorHomePage.tsx` — B1
- `apps/web/src/features/availability/components/SelectedDatesPanel.tsx` — B2
- `apps/web/src/shared/utils/formatDate.ts` — B2 (new)
- `apps/web/src/shared/layouts/AppLayout.tsx` — B5 (nav)
- `apps/web/src/app/routes.tsx` — B5 (route guard)

**Infra**
- `infra/README.md`, `infra/iam.tf` — C2

**i18n**
- `apps/web/src/shared/i18n/he.json` + `en.json` — B2 (`proctor.selectedDates.notChosen`)

---

## Verification per gap

After implementing each, verify with the manual smoke check below in
addition to the test suite:

| Gap | Manual check |
|----|---|
| B1 | Open the proctor calendar; non-exam days are visibly greyed and click is a no-op. |
| B2 | Selected-dates panel shows all exams with `DD/MM/YYYY` + ✓ / ✗ / – pill. |
| B4 | Deactivate a proctor with future assignments only in an `open` period → succeeds; with assignments in `scheduled` → blocked. |
| B5 | Log in as exam_staff; `/admin/audit-log` returns 403, nav link hidden. |
| B8 | Run scheduler on a balanced fixture; shift counts vary by ≤ 1. |
| C1 | Invalid transition (e.g., send before scheduler ran) → 422; valid path unchanged. |
| C2 | `infra/README.md` lists the email-from secret with the same shape as the others. |
