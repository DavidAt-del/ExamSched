/**
 * Forced password-change flow for first-login users (must_change_password=true).
 *
 * - Logging in routes to /change-password (RequireAuth honours the JWT claim).
 * - Trying to navigate elsewhere bounces back to /change-password.
 * - Mismatched confirm shows an inline error.
 * - Submitting a fresh password ends the session and routes to /login;
 *   re-logging with the new password lands on /calendar.
 *
 * Each test resets the user back to the seed state via a direct DB helper
 * so the suite is order-independent.
 */
import { test, expect } from '@playwright/test';
import { PROCTOR_OPENER_FIRST_LOGIN } from './fixtures/users';
import { loginViaForm } from './fixtures/auth';
import { resetUserPassword } from './fixtures/db';

test.describe('forced change password', () => {
  test.beforeEach(async () => {
    await resetUserPassword(
      PROCTOR_OPENER_FIRST_LOGIN.id,
      PROCTOR_OPENER_FIRST_LOGIN.password,
      true,
    );
  });

  test.afterAll(async () => {
    // Leave the seed in the first-login state for any later workers.
    await resetUserPassword(
      PROCTOR_OPENER_FIRST_LOGIN.id,
      PROCTOR_OPENER_FIRST_LOGIN.password,
      true,
    );
  });

  test('first-login routes to /change-password', async ({ page }) => {
    await loginViaForm(page, PROCTOR_OPENER_FIRST_LOGIN);
    await expect(page).toHaveURL(/\/change-password$/);
    await expect(page.getByRole('heading', { name: 'החלפת סיסמה' })).toBeVisible();
  });

  test('cannot dodge the prompt by navigating elsewhere', async ({ page }) => {
    await loginViaForm(page, PROCTOR_OPENER_FIRST_LOGIN);
    await expect(page).toHaveURL(/\/change-password$/);
    await page.goto('/calendar');
    await expect(page).toHaveURL(/\/change-password$/);
  });

  test('mismatched confirm shows inline error', async ({ page }) => {
    await loginViaForm(page, PROCTOR_OPENER_FIRST_LOGIN);
    await page.getByLabel('הסיסמה הנוכחית').fill(PROCTOR_OPENER_FIRST_LOGIN.password);
    await page.getByLabel('סיסמה חדשה', { exact: true }).fill('newSecret1');
    await page.getByLabel('אימות סיסמה חדשה').fill('different-value');
    await page.getByRole('button', { name: 'שמירה' }).click();
    await expect(page.getByText('אימות הסיסמה אינו תואם.')).toBeVisible();
  });

  test('successful change ends session, then re-login lands on /calendar', async ({ page }) => {
    const newPassword = 'newSecretA1';
    await loginViaForm(page, PROCTOR_OPENER_FIRST_LOGIN);
    await page.getByLabel('הסיסמה הנוכחית').fill(PROCTOR_OPENER_FIRST_LOGIN.password);
    await page.getByLabel('סיסמה חדשה', { exact: true }).fill(newPassword);
    await page.getByLabel('אימות סיסמה חדשה').fill(newPassword);
    await page.getByRole('button', { name: 'שמירה' }).click();

    await expect(page).toHaveURL(/\/login$/);

    await loginViaForm(page, { ...PROCTOR_OPENER_FIRST_LOGIN, password: newPassword });
    await expect(page).toHaveURL(/\/calendar$/);
  });
});
