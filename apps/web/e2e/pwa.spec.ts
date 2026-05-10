/**
 * PWA smoke checks. The app ships a manifest, two-size PNG icon set, an
 * apple-touch-icon, and a vanilla service worker. We don't drive install
 * prompts — those are browser-internal — but we do assert the static
 * surface that browsers consume.
 *
 * Service worker registration only happens in PROD builds (`import.meta.env.PROD`
 * guard in main.tsx), so this spec asserts the *file* is reachable; it does
 * not assert the SW is *active* in dev mode.
 */
import { test, expect } from '@playwright/test';

test.describe('PWA static assets', () => {
  test('manifest is reachable and Hebrew/RTL', async ({ page, request }) => {
    await page.goto('/login');
    const link = page.locator('link[rel="manifest"]');
    await expect(link).toHaveAttribute('href', '/manifest.webmanifest');

    const res = await request.get('/manifest.webmanifest');
    expect(res.ok()).toBe(true);
    const m = (await res.json()) as {
      lang: string;
      dir: string;
      icons: Array<{ src: string; sizes: string; type: string }>;
    };
    expect(m.lang).toBe('he');
    expect(m.dir).toBe('rtl');
    const sizes = m.icons.map((i) => i.sizes).sort();
    expect(sizes).toEqual(['192x192', '512x512', 'any']);
  });

  test('icon PNGs are served with image/png', async ({ request }) => {
    for (const path of ['/icon-192.png', '/icon-512.png', '/apple-touch-icon.png']) {
      const res = await request.get(path);
      expect(res.ok(), `${path} should 200`).toBe(true);
      expect(res.headers()['content-type']).toContain('image/png');
    }
  });

  test('service-worker.js is reachable and includes the precache list', async ({ request }) => {
    const res = await request.get('/service-worker.js');
    expect(res.ok()).toBe(true);
    const body = await res.text();
    // The vanilla SW pre-caches the shell; the constant name is stable.
    expect(body).toContain('PRECACHE_URLS');
  });
});
