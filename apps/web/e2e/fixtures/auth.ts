import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import type { TestUser } from './users';

/**
 * Drives the actual login form (Hebrew labels). Use this for specs that
 * cover login behaviour itself; for tests that just need a session, prefer
 * `seedSession` which short-circuits the form.
 */
export async function loginViaForm(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('תעודת זהות').fill(user.nationalId);
  await page.getByLabel('סיסמה').fill(user.password);
  await page.getByRole('button', { name: 'כניסה' }).click();
}

/**
 * Logs in via the API and seeds sessionStorage so the SPA boots with an
 * authenticated session. Skips the login form to keep specs focused on
 * downstream flows.
 */
export async function seedSession(page: Page, user: TestUser): Promise<void> {
  // First navigate so the page has the right origin for sessionStorage.
  await page.goto('/login');
  const apiBase = '/api';
  const response = await page.request.post(`${apiBase}/auth/login`, {
    data: { nationalId: user.nationalId, password: user.password },
  });
  expect(response.ok(), `login API failed: ${response.status()}`).toBe(true);
  const body = (await response.json()) as { token: string; user: unknown };
  await page.evaluate(
    ({ token, u }) => {
      sessionStorage.setItem('proctor.session.token', token);
      sessionStorage.setItem('proctor.session.user', JSON.stringify(u));
    },
    { token: body.token, u: body.user },
  );
}

/**
 * Hits the admin run-scheduler endpoint for the seeded period after a
 * proctor has marked availability. Used by the "my schedule" specs to
 * arrange a sent state quickly.
 */
export async function runSchedulerAndSend(
  page: Page,
  staff: TestUser,
  periodId: string,
): Promise<void> {
  const auth = await page.request.post(`/api/auth/login`, {
    data: { nationalId: staff.nationalId, password: staff.password },
  });
  const { token } = (await auth.json()) as { token: string };
  const headers = { Authorization: `Bearer ${token}` };

  const run = await page.request.post(`/api/admin/periods/${periodId}/schedule`, {
    headers,
  });
  expect(run.ok()).toBe(true);

  const send = await page.request.post(
    `/api/admin/periods/${periodId}/send-schedule`,
    { headers, data: {} },
  );
  expect(send.ok()).toBe(true);
}

/**
 * Helper: marks one exam as available for the supplied proctor via API,
 * skipping the calendar UI.
 */
export async function markAvailability(
  page: Page,
  user: TestUser,
  examId: string,
  available: boolean,
): Promise<void> {
  const auth = await page.request.post(`/api/auth/login`, {
    data: { nationalId: user.nationalId, password: user.password },
  });
  const { token } = (await auth.json()) as { token: string };
  await page.request.post(`/api/availability`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { examId, available },
  });
}
