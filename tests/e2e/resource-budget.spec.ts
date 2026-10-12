import { test, expect } from 'playwright/test';
import { DatabaseSync } from 'node:sqlite';
import { basename, dirname, resolve } from 'node:path';

for (const kind of ['daily', 'lifetime'] as const) {
  test(`public-demo ${kind} limit explains recovery and preserves the page`, async ({
    page,
    baseURL,
  }) => {
    // Mutate only the automatically isolated local test database, never a configured cloud or user database.
    const path = resolve(process.env.TRACELAB_E2E_DB ?? '');
    if (
      baseURL !== 'http://127.0.0.1:3000' ||
      dirname(path) !== resolve('.data') ||
      !/^e2e-\d+\.db$/.test(basename(path))
    )
      throw new Error('Quota browser test requires the isolated e2e database');
    const db = new DatabaseSync(path);
    db.exec('PRAGMA busy_timeout=5000');
    const prior = db
      .prepare("SELECT * FROM resource_budgets WHERE resource='identities'")
      .get();
    try {
      const day = Math.floor(Date.now() / 86400000);
      db.prepare(
        "INSERT INTO resource_budgets VALUES('identities',?,?,?) ON CONFLICT(resource) DO UPDATE SET day=excluded.day,day_used=excluded.day_used,total_used=excluded.total_used",
      ).run(day, kind === 'daily' ? 100 : 0, kind === 'daily' ? 100 : 1000);
      await page.goto('/');
      const response = page.waitForResponse(
        (r) => r.url().endsWith('/api/demo') && r.request().method() === 'POST',
      );
      await page
        .getByRole('button', { name: 'Debug a student’s thinking' })
        .click();
      const denied = await response;
      expect(denied.status()).toBe(429);
      expect(denied.headers()['retry-after'] === undefined).toBe(
        kind === 'lifetime',
      );
      await expect(
        page.getByRole('alert', { name: 'Request error' }),
      ).toContainText(
        kind === 'daily' ? 'midnight UTC' : 'operator capacity review',
      );
      await page.getByRole('button', { name: 'Dismiss error' }).focus();
      await page.keyboard.press('Enter');
      await expect(
        page.getByRole('alert', { name: 'Request error' }),
      ).toHaveCount(0);
      await expect(
        page.getByRole('heading', {
          name: 'A wrong answer. A useful beginning.',
        }),
      ).toBeVisible();
      expect((await page.request.get('/api/skills')).status()).toBe(200);
    } finally {
      if (prior)
        db.prepare(
          "UPDATE resource_budgets SET day=?,day_used=?,total_used=? WHERE resource='identities'",
        ).run(prior.day!, prior.day_used!, prior.total_used!);
      else
        db.prepare(
          "DELETE FROM resource_budgets WHERE resource='identities'",
        ).run();
      db.close();
    }
  });
}
