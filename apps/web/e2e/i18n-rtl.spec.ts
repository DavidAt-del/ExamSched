/**
 * RTL + Hebrew i18n smoke. Confirms the document is rendered right-to-left
 * and that core Hebrew copy is present on every visible page. Mobile-aware:
 * runs against both the desktop browsers and the Pixel 5 / iPhone 13 device
 * profiles defined in playwright.config.ts.
 */
import { test, expect } from '@playwright/test';
import { ADMIN } from './fixtures/users';
import { loginViaForm } from './fixtures/auth';

test.describe('Hebrew + RTL', () => {
  test('login page is dir=rtl with lang=he', async ({ page }) => {
    await page.goto('/login');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'he');
    await expect(page.getByRole('heading', { name: 'התחברות' })).toBeVisible();
  });

  test('app shell shows Hebrew nav after login', async ({ page }) => {
    await loginViaForm(page, ADMIN);
    await expect(page.getByText('שיבוץ משגיחים').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'משגיחים' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'תקופות בחינה' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'התנתקות' })).toBeVisible();
  });

  test('input direction is RTL on the login form', async ({ page }) => {
    await page.goto('/login');
    const idInput = page.getByLabel('תעודת זהות');
    // The HTML root sets dir=rtl globally; computed style should resolve to
    // rtl for the input field as well.
    const direction = await idInput.evaluate((el) => getComputedStyle(el).direction);
    expect(direction).toBe('rtl');
  });
});
