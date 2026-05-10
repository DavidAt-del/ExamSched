import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
// CI tunes timeouts up because Cloud Build's I/O is slower than a local laptop.
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './e2e',
  // Each test runs in its own browser context; spec-level isolation is
  // enforced by global-setup re-seeding the test fixtures before the suite.
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1, // serialised so multiple specs don't race on the seed dataset
  reporter: isCI
    ? [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]]
    : [['list']],

  globalSetup: './e2e/global-setup.ts',

  use: {
    baseURL: BASE_URL,
    locale: 'he-IL',
    timezoneId: 'Asia/Jerusalem',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'desktop-firefox',
      use: { ...devices['Desktop Firefox'] },
      // Firefox is a smoke profile — run only the smallest critical specs to
      // keep CI duration down. We rely on Chromium for the full coverage.
      testMatch: /(auth|i18n-rtl)\.spec\.ts/,
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
      // Mobile is the proctor's primary device; constrain to specs that
      // exercise the proctor flow (auth, availability, schedule, RTL).
      testMatch:
        /(auth|forced-change-password|proctor-availability|proctor-my-schedule|i18n-rtl)\.spec\.ts/,
    },
    {
      name: 'mobile-webkit',
      use: { ...devices['iPhone 13'] },
      testMatch:
        /(auth|forced-change-password|proctor-availability|proctor-my-schedule|i18n-rtl|pwa)\.spec\.ts/,
    },
  ],

  // Spawn the dev API + dev web automatically when running the suite locally.
  // CI brings them up explicitly; set E2E_SKIP_WEBSERVER=1 to opt out (the
  // field is then omitted entirely so strict optional types stay happy).
  ...(process.env.E2E_SKIP_WEBSERVER === '1'
    ? {}
    : {
        webServer: [
          {
            command: 'npm --workspace @app/api run dev',
            url: 'http://localhost:8080/api/health',
            cwd: '../..',
            reuseExistingServer: !isCI,
            stdout: 'pipe' as const,
            stderr: 'pipe' as const,
            timeout: 120_000,
          },
          {
            command: 'npm --workspace @app/web run dev',
            url: BASE_URL,
            cwd: '../..',
            reuseExistingServer: !isCI,
            stdout: 'pipe' as const,
            stderr: 'pipe' as const,
            timeout: 60_000,
          },
        ],
      }),
});
