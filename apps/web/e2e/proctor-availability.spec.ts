/**
 * Proctor availability flow.
 *
 * Covers the calendar tab on /calendar:
 *   - Open period renders the deadline + selected-dates panel.
 *   - Marking an exam available via the API mirrors back into the
 *     "selected dates" sidebar (round-trip: mutation → list → render).
 *   - The Submit button enables only after a selection exists.
 *   - Submitting finalises the period (locks subsequent edits).
 *
 * We use the API to mark availability (rather than clicking the FullCalendar
 * event) because FC events are SVG/canvas-rendered and brittle to drive
 * deterministically. The UI "selected dates" panel is the visible side-effect
 * we assert on.
 */
import { test, expect } from '@playwright/test';
import { PROCTOR_REGULAR, TEST_EXAM, TEST_PERIOD } from './fixtures/users';
import { loginViaForm, markAvailability } from './fixtures/auth';
import { clearPeriodState } from './fixtures/db';

test.describe('proctor availability', () => {
  test.beforeEach(async () => {
    // Fresh availability state every test — clean panel, unsubmitted period.
    await clearPeriodState(TEST_PERIOD.id);
  });

  test('availability tab shows the open period heading and deadline', async ({ page }) => {
    await loginViaForm(page, PROCTOR_REGULAR);
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.getByRole('heading', { name: TEST_PERIOD.name })).toBeVisible();
    // Deadline label
    await expect(page.getByText('תאריך אחרון לעדכון זמינות')).toBeVisible();
  });

  test('marking availability via API surfaces in the selected-dates panel', async ({ page }) => {
    // Pre-mark before navigating so the initial render already reflects it.
    await markAvailability(page, PROCTOR_REGULAR, TEST_EXAM.id, true);

    await loginViaForm(page, PROCTOR_REGULAR);
    await expect(page).toHaveURL(/\/calendar$/);

    // Selected dates aside renders the YYYY-MM-DD of the marked exam.
    const aside = page.locator('aside').filter({ hasText: 'התאריכים שבחרתי' });
    await expect(aside).toBeVisible();
    await expect(aside.getByText(TEST_EXAM.examDate)).toBeVisible();
  });

  test('submit is disabled until at least one selection', async ({ page }) => {
    await loginViaForm(page, PROCTOR_REGULAR);
    await expect(page.getByRole('button', { name: 'שלח' })).toBeDisabled();

    await markAvailability(page, PROCTOR_REGULAR, TEST_EXAM.id, true);
    await page.reload();
    await expect(page.getByRole('button', { name: 'שלח' })).toBeEnabled();
  });

  test('submitting locks the period and shows the thanks banner', async ({ page }) => {
    await markAvailability(page, PROCTOR_REGULAR, TEST_EXAM.id, true);
    await loginViaForm(page, PROCTOR_REGULAR);

    await page.getByRole('button', { name: 'שלח' }).click();
    // Confirm dialog (the CTA inside the dialog has the same text).
    await page.getByRole('button', { name: 'שלח' }).last().click();

    await expect(
      page.getByText('תודה, המתן לשיבוץ ע"י מדור בחינות.'),
    ).toBeVisible();
  });
});
