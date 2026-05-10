/**
 * Admin exam-periods page.
 *
 * - Renders the seeded "E2E Period" with its open badge.
 * - Expanding the period reveals the exams table.
 * - Creating a new period adds a card; closing it flips the status badge to "סגור".
 *
 * The DB cleanup at the end keeps the shared fixture footprint identical
 * across runs.
 */
import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import { ADMIN, TEST_PERIOD } from './fixtures/users';
import { loginViaForm } from './fixtures/auth';

async function deletePeriodsByName(prefix: string): Promise<void> {
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
      `DELETE FROM exams WHERE period_id IN (SELECT id FROM exam_periods WHERE name LIKE $1)`,
      [`${prefix}%`],
    );
    await client.query(`DELETE FROM exam_periods WHERE name LIKE $1`, [`${prefix}%`]);
  } finally {
    await client.end();
  }
}

test.describe('admin periods + exams page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, ADMIN);
    await page.goto('/admin/periods');
    await expect(page.getByRole('heading', { name: 'תקופות בחינה' })).toBeVisible();
  });

  test('seeded period renders with open badge', async ({ page }) => {
    const periodCard = page.getByRole('article').filter({ hasText: TEST_PERIOD.name });
    await expect(periodCard).toBeVisible();
    await expect(periodCard.getByText('פתוח')).toBeVisible();
  });

  test('expanding the period reveals the exams table', async ({ page }) => {
    const periodCard = page.getByRole('article').filter({ hasText: TEST_PERIOD.name });
    await periodCard.getByRole('button', { name: '+' }).click();
    await expect(page.getByRole('heading', { name: 'בחינות בתקופה' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'הוסף בחינה' })).toBeVisible();
  });

  test('create + close period flow', async ({ page }) => {
    const newName = `E2E Sandbox ${Date.now()}`;
    await page.getByRole('button', { name: 'תקופה חדשה' }).click();
    await page.getByLabel('שם התקופה').fill(newName);
    // datetime-local: 30 days out, top of the hour.
    const deadline = new Date(Date.now() + 30 * 86_400_000);
    deadline.setHours(12, 0, 0, 0);
    const iso = deadline.toISOString().slice(0, 16);
    await page.getByLabel('תאריך אחרון לעדכון זמינות').fill(iso);
    await page.getByRole('button', { name: 'שמירה' }).click();

    const newCard = page.getByRole('article').filter({ hasText: newName });
    await expect(newCard).toBeVisible();
    await expect(newCard.getByText('פתוח')).toBeVisible();

    // Close the new period.
    await newCard.getByRole('button', { name: 'סגירה' }).click();
    // ConfirmDialog's confirm button reuses the same Hebrew label "סגירה".
    await page.getByRole('button', { name: 'סגירה' }).last().click();
    await expect(newCard.getByText('סגור')).toBeVisible();

    await deletePeriodsByName('E2E Sandbox');
  });
});
