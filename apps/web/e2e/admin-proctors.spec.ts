/**
 * Admin proctors page CRUD smoke.
 *
 * - Renders the seeded proctors.
 * - Create flow: opens the dialog, fills it, sees the new row.
 * - Reset-password flow: shows the temp password and dismisses.
 * - Deactivate confirmation: row flips to inactive.
 *
 * The Excel import path is exercised at the API level by integration tests;
 * here we verify the UI button renders so the smoke catches a regression.
 */
import { test, expect } from '@playwright/test';
import { Client } from 'pg';
import bcrypt from 'bcrypt';
import { ADMIN, PROCTOR_REGULAR } from './fixtures/users';
import { loginViaForm } from './fixtures/auth';

// Per-test we add a throwaway proctor we own; clean it up in afterEach so
// the shared fixture stays deterministic. National ID 000000059 has a valid
// Israeli check digit (computed offline like the others).
const NEW_PROCTOR_NID = '000000059';
const NEW_PROCTOR_FIRST = 'Maya';
const NEW_PROCTOR_LAST = 'Sade';

async function deleteProctorByNationalId(nationalId: string): Promise<void> {
  const client = new Client({
    host: process.env.E2E_DB_HOST ?? 'localhost',
    port: Number(process.env.E2E_DB_PORT ?? 5432),
    user: process.env.E2E_DB_USER ?? 'app',
    password: process.env.E2E_DB_PASSWORD ?? 'app',
    database: process.env.E2E_DB_NAME ?? 'proctor_scheduler',
  });
  await client.connect();
  try {
    await client.query(`DELETE FROM users WHERE national_id = $1`, [nationalId]);
  } finally {
    await client.end();
  }
}

async function reactivateProctor(id: string): Promise<void> {
  const client = new Client({
    host: process.env.E2E_DB_HOST ?? 'localhost',
    port: Number(process.env.E2E_DB_PORT ?? 5432),
    user: process.env.E2E_DB_USER ?? 'app',
    password: process.env.E2E_DB_PASSWORD ?? 'app',
    database: process.env.E2E_DB_NAME ?? 'proctor_scheduler',
  });
  await client.connect();
  try {
    await client.query(`UPDATE users SET active = true WHERE id = $1`, [id]);
  } finally {
    await client.end();
  }
}

async function restoreProctorPassword(id: string, plaintext: string): Promise<void> {
  const hash = await bcrypt.hash(plaintext, 4);
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
      [hash, id],
    );
  } finally {
    await client.end();
  }
}

test.describe('admin proctors page', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaForm(page, ADMIN);
    await page.goto('/admin/proctors');
    await expect(page.getByRole('heading', { name: 'ניהול משגיחים' })).toBeVisible();
  });

  test('renders seeded proctors and toolbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'הוסף משגיח' })).toBeVisible();
    await expect(page.getByText('ייבוא מקובץ')).toBeVisible();
    // Seeded regular proctor row is present.
    await expect(page.getByText(PROCTOR_REGULAR.nationalId)).toBeVisible();
  });

  test('create proctor adds a new row', async ({ page }) => {
    await page.getByRole('button', { name: 'הוסף משגיח' }).click();
    await page.getByLabel('תעודת זהות').fill(NEW_PROCTOR_NID);
    await page.getByLabel('שם פרטי').fill(NEW_PROCTOR_FIRST);
    await page.getByLabel('שם משפחה').fill(NEW_PROCTOR_LAST);
    await page.getByRole('button', { name: 'שמירה' }).click();

    await expect(page.getByText(NEW_PROCTOR_NID)).toBeVisible();
    await expect(
      page.getByText(`${NEW_PROCTOR_FIRST} ${NEW_PROCTOR_LAST}`),
    ).toBeVisible();

    await deleteProctorByNationalId(NEW_PROCTOR_NID);
  });

  test('reset password reveals a temporary password modal', async ({ page }) => {
    const row = page.getByRole('row', { name: new RegExp(PROCTOR_REGULAR.nationalId) });
    await row.getByRole('button', { name: 'איפוס סיסמה' }).click();
    // The result dialog uses i18n key "סיסמה זמנית: {{password}}".
    await expect(page.getByText(/סיסמה זמנית: \S+/)).toBeVisible();
    await page.getByRole('button', { name: 'סגירה' }).click();

    // Restore the seed password so other specs stay deterministic.
    await restoreProctorPassword(PROCTOR_REGULAR.id, PROCTOR_REGULAR.password);
  });

  test('deactivate flips the row to inactive', async ({ page }) => {
    const row = page.getByRole('row', { name: new RegExp(PROCTOR_REGULAR.nationalId) });
    await row.getByRole('button', { name: 'השבתה' }).click();
    // Confirm dialog
    await page.getByRole('button', { name: 'השבתה' }).last().click();

    await expect(row.getByText('לא פעיל')).toBeVisible();

    await reactivateProctor(PROCTOR_REGULAR.id);
  });
});
