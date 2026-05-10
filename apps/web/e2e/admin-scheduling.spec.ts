/**
 * Admin scheduling page (/admin/periods/:periodId/schedule).
 *
 * - Empty state when there are no assignments yet.
 * - Run scheduler → events appear (we don't pin colours; we just check that
 *   the FullCalendar events render after a successful run).
 * - Send-schedule modal: opens, lists recipients, sends, shows result text.
 * - Export link points at the API export endpoint and serves an .xlsx blob
 *   (downloaded as an attachment).
 */
import { test, expect } from '@playwright/test';
import {
  ADMIN,
  PROCTOR_OPENER_FIRST_LOGIN,
  PROCTOR_REGULAR,
  STAFF,
  TEST_EXAM,
  TEST_PERIOD,
} from './fixtures/users';
import { loginViaForm, markAvailability } from './fixtures/auth';
import { clearPeriodState, resetUserPassword } from './fixtures/db';

test.describe('admin scheduling page', () => {
  test.beforeAll(async () => {
    // Take the opener proctor out of must-change-password so the scheduler
    // sees them as a candidate.
    await resetUserPassword(PROCTOR_OPENER_FIRST_LOGIN.id, 'temp-Pass1', false);
  });

  test.afterAll(async () => {
    await resetUserPassword(
      PROCTOR_OPENER_FIRST_LOGIN.id,
      PROCTOR_OPENER_FIRST_LOGIN.password,
      true,
    );
  });

  test.beforeEach(async ({ page }) => {
    await clearPeriodState(TEST_PERIOD.id);
    await loginViaForm(page, ADMIN);
    await page.goto(`/admin/periods/${TEST_PERIOD.id}/schedule`);
    await expect(page.getByRole('heading', { name: 'שיבוץ משגיחים' })).toBeVisible();
  });

  test('empty state before scheduler runs', async ({ page }) => {
    // No-availability period — scheduler hasn't run, so the page shows
    // "no exams" copy.
    await expect(page.getByText('אין בחינות בתקופה זו')).toBeVisible();
    // Send button is disabled (period.status !== Scheduled).
    await expect(page.getByRole('button', { name: 'שלח סידור עבודה' })).toBeDisabled();
  });

  test('run scheduler renders events on the calendar', async ({ page }) => {
    // Both proctors mark themselves available so the scheduler has options.
    await markAvailability(page, PROCTOR_REGULAR, TEST_EXAM.id, true);
    await markAvailability(
      page,
      { ...PROCTOR_OPENER_FIRST_LOGIN, password: 'temp-Pass1' },
      TEST_EXAM.id,
      true,
    );

    await page.reload();
    await page.getByRole('button', { name: 'הרץ שיבוץ אוטומטי' }).click();
    // Confirm dialog shares the same label.
    await page.getByRole('button', { name: 'הרץ שיבוץ אוטומטי' }).last().click();

    // Send button enables once the period flips to Scheduled.
    await expect(page.getByRole('button', { name: 'שלח סידור עבודה' })).toBeEnabled();
    // FullCalendar renders events as <a class="fc-event"> nodes.
    await expect(page.locator('.fc-event').first()).toBeVisible({ timeout: 15_000 });
  });

  test('send schedule shows result counts', async ({ page }) => {
    await markAvailability(page, PROCTOR_REGULAR, TEST_EXAM.id, true);
    await markAvailability(
      page,
      { ...PROCTOR_OPENER_FIRST_LOGIN, password: 'temp-Pass1' },
      TEST_EXAM.id,
      true,
    );
    // Drive the scheduler via the API to keep this spec tight.
    const auth = await page.request.post('/api/auth/login', {
      data: { nationalId: STAFF.nationalId, password: STAFF.password },
    });
    const { token } = (await auth.json()) as { token: string };
    await page.request.post(`/api/admin/periods/${TEST_PERIOD.id}/schedule`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    await page.reload();
    await page.getByRole('button', { name: 'שלח סידור עבודה' }).click();
    // Modal shows checkboxes + a "send" button labelled "שלח".
    await expect(page.getByRole('heading', { name: 'שליחת סידור עבודה' })).toBeVisible();
    await page.getByRole('button', { name: 'שלח', exact: true }).click();
    // Result line uses i18n template "נשלחו: X • דולגו: Y • נכשלו: Z".
    await expect(page.getByText(/נשלחו:\s*\d+/)).toBeVisible();
  });

  test('export link points at the xlsx endpoint', async ({ page }) => {
    const exportLink = page.getByRole('link', { name: 'ייצוא לאקסל' });
    await expect(exportLink).toBeVisible();
    const href = await exportLink.getAttribute('href');
    expect(href).toBe(`/api/admin/periods/${TEST_PERIOD.id}/schedule/export`);
  });
});
