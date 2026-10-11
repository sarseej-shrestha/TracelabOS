import { defineConfig } from 'playwright/test';
const baseURL = process.env.TRACELAB_CLOUD_URL;
if (
  !baseURL ||
  new URL(baseURL).origin !== 'https://tracelabos.sarseej-shrestha.workers.dev'
)
  throw Error(
    'Set TRACELAB_CLOUD_URL to the official deployed demo; creates fictional accounts and records',
  );
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['classroom.spec.ts', 'workflow.spec.ts'],
  workers: 1,
  fullyParallel: false,
  timeout: 90000,
  expect: { timeout: 15000 },
  reporter: [
    ['list'],
    ['json', { outputFile: 'artifacts/cloud-browser-results.json' }],
  ],
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
    trace: 'retain-on-failure',
  },
});
