/**
 * Proctor "my schedule" tab.
 *
 * Sequencing:
 *   1. Reset period state.
 *   2. Have the proctor mark availability via API.
 *   3. Run scheduler + send-schedule via the staff API.
 *   4. Log in as the proctor → "השיבוץ שלי" tab is now visible (period sent).
 *   5. Empty-state of MySchedulePage when the proctor wasn't assigned.
 *
 * Since there's only one regular proctor (no opener participating), the
 * scheduler may leave the exam unfilled. We still assert that the tab
 * exists and that the empty-state copy renders cleanly when there are no
 * assignments for this proctor.
 */
import { test, expect } from '@playwright/test';
import {
  PROCTOR_OPENER_FIRST_LOGIN,
  PROCTOR_REGULAR,
  STAFF,
  TEST_EXAM,
  TEST_PERIOD,
} from './fixtures/users';
import {
  loginViaForm,
  markAvailability,
  runSchedulerAndSend,
} from './fixtures/auth';
import { clearPeriodState, resetUserPassword } from './fixtures/db';

test.describe('proctor my-schedule tab', () => {
  test.beforeAll(async () => {
    // Ensure the opener proctor is in a known state (no must-change-password)
    // so they're a valid candidate for the scheduler. We then put them back
    // into their seed state in afterAll.
    await resetUserPassword(PROCTOR_OPENER_FIRST_LOGIN.id, 'temp-Pass1', false);
  });

  test.afterAll(async () => {
    await resetUserPassword(
      PROCTOR_OPENER_FIRST_LOGIN.id,
      PROCTOR_OPENER_FIRST_LOGIN.password,
      true,
    );
  });

  test.beforeEach(async () => {
    await clearPeriodState(TEST_PERIOD.id);
  });

  test('schedule tab appears once the period is sent', async ({ page }) => {
    // Both proctors mark themselves available.
    await markAvailability(page, PROCTOR_REGULAR, TEST_EXAM.id, true);
    await markAvailability(
      page,
      { ...PROCTOR_OPENER_FIRST_LOGIN, password: 'temp-Pass1' },
      TEST_EXAM.id,
      true,
    );

    await runSchedulerAndSend(page, STAFF, TEST_PERIOD.id);

    await loginViaForm(page, PROCTOR_REGULAR);
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.getByRole('button', { name: 'השיבוץ שלי' })).toBeVisible();
  });

  test('empty schedule shows the polite copy when proctor has no assignments', async ({
    page,
  }) => {
    // Only the opener marks availability — solo opener can be picked, leaving
    // the regular proctor unassigned. After send, the regular's MySchedule
    // is empty.
    await markAvailability(
      page,
      { ...PROCTOR_OPENER_FIRST_LOGIN, password: 'temp-Pass1' },
      TEST_EXAM.id,
      true,
    );
    await runSchedulerAndSend(page, STAFF, TEST_PERIOD.id);

    await loginViaForm(page, PROCTOR_REGULAR);
    await expect(page).toHaveURL(/\/calendar$/);
    await page.getByRole('button', { name: 'השיבוץ שלי' }).click();
    await expect(
      page.getByText(
        'אין שיבוצים זמינים כרגע. תקבל הודעה לאחר שליחת הסידור על ידי מדור בחינות.',
      ),
    ).toBeVisible();
  });
});
