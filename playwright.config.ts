import { defineConfig } from 'playwright/test';
import { resolve } from 'node:path';
const database = (process.env.TRACELAB_E2E_DB ??= resolve(
  `.data/e2e-${process.pid}.db`,
));
const environment = {
  TRACELAB_DB_PATH: database,
  DATABASE_URL: '',
  CLOUDFLARE_ACCOUNT_ID: '',
  R2_BUCKET: '',
  R2_ACCESS_KEY_ID: '',
  R2_SECRET_ACCESS_KEY: '',
  TRACELAB_OCR_URL: 'http://127.0.0.1:8031/transcribe',
  TRACELAB_OCR_TOKEN: 'tracelab-test-only-token-not-a-production-secret',
  TRACELAB_PUBLIC_ORIGIN: 'http://127.0.0.1:3000',
};
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['json', { outputFile: 'artifacts/browser-results.json' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH }
      : {},
  },
  webServer: [
    {
      command:
        'node --experimental-transform-types tests/helpers/ocr-browser-service.ts',
      url: 'http://127.0.0.1:8031/health',
      env: environment,
      reuseExistingServer: false,
    },
    {
      command: 'pnpm start',
      url: 'http://127.0.0.1:3000',
      reuseExistingServer: false,
      env: environment,
      timeout: 60000,
    },
  ],
});
