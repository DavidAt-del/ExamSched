/**
 * Admin "exam-staff users" + audit-log smoke.
 *
 * - Users page lists the seeded exam-staff and lets admin reset their
 *   password (modal shows the temporary password).
 * - Audit log renders the table and reflects an action that just happened
 *   (the password reset above produces an `auth.password_reset` row).
 */
import { test, expect } from '@playwright/test';
import bcrypt from 'bcrypt';
import { Client } from 'pg';
import { ADMIN, STAFF } from './fixtures/users';
import { loginViaForm } from './fixtures/auth';

async function restoreStaffPassword(): Promise<void> {
  const hash = await bcrypt.hash(STAFF.password, 4);
  const client = new Client({
    host: process.env.E2E_DB_HOST ?? 'localhost',
    port: Number(process.env.E2E_DB_PORT ?? 5432),
    user: process.env.E2E_DB_USER ?? 'app',
    password: process.env.E2E_DB_PASSWORD ?? 'app',
    database: process.env.E2E_DB_NAME ?? 'proctor_scheduler',
  });
  await client.connect();
  try {
    await client.query(
      `UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2`,
      [hash, STAFF.id],
    );
  } finally {
    await client.end();
  }
}

test.describe('admin users + audit log', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, ADMIN);
  });

  test('reset staff password reveals temp + emits audit row', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page.getByRole('heading', { name: 'משתמשי מדור בחינות' })).toBeVisible();

    const row = page
      .getByRole('row')
      .filter({ hasText: `${STAFF.firstName} ${STAFF.lastName}` });
    await row.getByRole('button', { name: 'איפוס סיסמה' }).click();

    // Confirm dialog → click confirm with the same label.
    await page.getByRole('button', { name: 'איפוס סיסמה' }).last().click();

    // Result modal shows the temporary password.
    await expect(page.getByText(/סיסמה זמנית: \S+/)).toBeVisible();
    await page.getByRole('button', { name: 'סגירה' }).click();

    // Audit log should now contain a recent row for this action.
    await page.goto('/admin/audit-log');
    await expect(page.getByRole('heading', { name: 'יומן פעולות' })).toBeVisible();
    await expect(page.getByText(/auth\.password_reset/).first()).toBeVisible();

    await restoreStaffPassword();
  });

  test('audit log filters render and pagination buttons exist', async ({ page }) => {
    await page.goto('/admin/audit-log');
    await expect(page.getByLabel('מתאריך')).toBeVisible();
    await expect(page.getByLabel('עד תאריך')).toBeVisible();
    await expect(page.getByLabel('רשומות בעמוד')).toBeVisible();
    await expect(page.getByRole('button', { name: 'הקודם' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'הבא' })).toBeVisible();
  });
});
