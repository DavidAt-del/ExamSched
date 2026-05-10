/**
 * Login + logout + role-based redirect after login.
 *
 * - Admin/staff land on the proctors admin page.
 * - Regular proctors (no must-change-password) land on the calendar.
 * - Invalid credentials surface the Hebrew error.
 * - Logout clears the session and bounces to /login.
 */
import { test, expect } from '@playwright/test';
import { ADMIN, STAFF, PROCTOR_REGULAR } from './fixtures/users';
import { loginViaForm } from './fixtures/auth';

test.describe('login flow', () => {
  test('admin lands on proctors admin', async ({ page }) => {
    await loginViaForm(page, ADMIN);
    await expect(page).toHaveURL(/\/admin\/proctors$/);
    await expect(page.getByRole('heading', { name: 'ניהול משגיחים' })).toBeVisible();
  });

  test('exam staff lands on proctors admin', async ({ page }) => {
    await loginViaForm(page, STAFF);
    await expect(page).toHaveURL(/\/admin\/proctors$/);
  });

  test('regular proctor lands on /calendar', async ({ page }) => {
    await loginViaForm(page, PROCTOR_REGULAR);
    await expect(page).toHaveURL(/\/calendar$/);
    // Calendar tab is the default; the availability tab heading is one cue.
    await expect(page.getByRole('button', { name: 'זמינות' })).toBeVisible();
  });

  test('invalid credentials show the error message', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('תעודת זהות').fill(ADMIN.nationalId);
    await page.getByLabel('סיסמה').fill('wrong-password');
    await page.getByRole('button', { name: 'כניסה' }).click();
    await expect(page.getByText('תעודת זהות או סיסמה שגויים')).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('logout returns to /login', async ({ page }) => {
    await loginViaForm(page, ADMIN);
    await expect(page).toHaveURL(/\/admin\/proctors$/);
    await page.getByRole('button', { name: 'התנתקות' }).click();
    await expect(page).toHaveURL(/\/login$/);
    // Going back to a protected route should bounce to /login again.
    await page.goto('/admin/proctors');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('unauthenticated access redirects to /login', async ({ page }) => {
    await page.goto('/admin/proctors');
    await expect(page).toHaveURL(/\/login$/);
  });
});
