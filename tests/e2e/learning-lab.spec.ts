import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import report from '../../artifacts/adaptive-strategy-results.json' with { type: 'json' };

test('learning sandbox explains ordered updates without writing student records', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page.getByRole('button', { name: 'Engineering', exact: false }).click();
  const writes: string[] = [],
    errors: string[] = [];
  page.on('request', (request) => {
    if (
      request.url().includes('/api/') &&
      !['GET', 'HEAD'].includes(request.method())
    )
      writes.push(request.url());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await expect(
    page.getByRole('heading', { name: 'What changes after one answer?' }),
  ).toBeVisible();
  const estimates = page.locator('.lab-estimates dd');
  await expect(estimates).toHaveText(['20.0%', '38.0%', '50.0%']);
  await expect(
    page.getByRole('button', { name: 'Undo last outcome' }),
  ).toBeDisabled();
  const correct = page.getByRole('button', { name: 'Add correct outcome' });
  await correct.focus();
  await page.keyboard.press('Enter');
  await expect(estimates).toHaveText(['52.6%', '59.2%', '66.7%']);
  await page.getByText('Inspect each observation', { exact: true }).click();
  const rows = page
    .getByRole('region', { name: 'Observation table', exact: true })
    .getByRole('row');
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(1).getByRole('cell')).toHaveText([
    'Correct',
    '38.0%',
    '50.0%',
    '52.6%',
  ]);
  await page
    .getByRole('button', { name: 'Add needs-practice outcome' })
    .click();
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(2).getByRole('cell')).toHaveText([
    'Needs practice',
    '59.2%',
    '66.7%',
    '21.6%',
  ]);
  await page.getByRole('button', { name: 'Undo last outcome' }).click();
  await expect(estimates).toHaveText(['52.6%', '59.2%', '66.7%']);
  await correct.click();
  await correct.click();
  await expect(
    page.getByRole('status').filter({ hasText: 'fictional outcomes' }),
  ).toContainText('Ready to try further variations');
  for (let count = 3; count < 20; count++) await correct.click();
  await expect(correct).toBeDisabled();
  await expect(
    page.getByRole('button', { name: 'Add needs-practice outcome' }),
  ).toBeDisabled();
  await expect(rows).toHaveCount(21);
  await page.getByRole('button', { name: 'Reset experiment' }).click();
  await expect(estimates).toHaveText(['20.0%', '38.0%', '50.0%']);
  await expect(
    page.getByText('Add an outcome to inspect the update.'),
  ).toBeVisible();
  await correct.click();
  await page.getByRole('button', { name: 'My assignments' }).click();
  await page.getByRole('button', { name: 'Engineering', exact: false }).click();
  await expect(estimates).toHaveText(['20.0%', '38.0%', '50.0%']);
  expect(writes).toEqual([]);
  expect(errors).toEqual([]);
});

test('published comparison supports scenario selection, mobile and accessible tables', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page.getByRole('button', { name: 'Engineering', exact: false }).click();
  const table = page.getByRole('region', {
    name: 'Prediction metrics',
    exact: true,
  });
  await expect(
    table.getByRole('cell', {
      name: report.scenarios[0]!.predictionMetrics.bkt.brier.toFixed(6),
      exact: true,
    }),
  ).toBeVisible();
  await page.getByLabel('Simulation scenario').selectOption('1');
  await expect(
    table.getByRole('cell', {
      name: report.scenarios[1]!.predictionMetrics.bkt.brier.toFixed(6),
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'held-out' }),
  ).toContainText('17,454 predictions');
  await page.getByText('Reproduction and limitations', { exact: true }).click();
  await expect(
    page.getByText(report.limitations[0]!, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Published measurement file' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/sarseej-shrestha/TracelabOS/blob/main/artifacts/adaptive-strategy-results.json',
  );
  await page.getByRole('button', { name: 'Add correct outcome' }).click();
  await page.getByText('Inspect each observation', { exact: true }).click();
  await page
    .getByText('Model assumptions and readiness rule', { exact: true })
    .click();
  await table.focus();
  await expect(table).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: 'artifacts/learning-lab-mobile.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: 'artifacts/learning-lab-desktop.png',
    fullPage: true,
  });
});
