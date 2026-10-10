import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('review corrections update one persisted attempt and student progress survives reload', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await page
    .getByRole('button', { name: 'Correct solution', exact: true })
    .click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check/ }).click();
  const progress = page.getByRole('region', {
    name: 'Reviewed skill progress',
  });
  await expect(progress.getByText('No reviewed evidence yet.')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await page.getByLabel('Teacher decision').selectOption('correct');
  await page
    .getByLabel('Review explanation')
    .fill('Checked the complete solution against the original problem.');
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(
    progress.getByText('1 reviewed attempt · 1 correct'),
  ).toBeVisible();
  await page.getByLabel('Teacher decision').selectOption('needs_practice');
  await page
    .getByLabel('Review explanation')
    .fill('Correction: more independent practice is needed for this skill.');
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(
    progress.getByText('1 reviewed attempt · 0 correct'),
  ).toBeVisible();
  await page.getByLabel('Teacher decision').selectOption('requires_review');
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(
    progress.getByText('0 reviewed attempts · 0 correct'),
  ).toBeVisible();
  await page.getByLabel('Teacher decision').selectOption('correct');
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(
    progress.getByText('1 reviewed attempt · 1 correct'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to student' }).click();
  await page.reload();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await expect(
    progress.getByText('1 reviewed attempt · 1 correct'),
  ).toBeVisible();
  await progress.getByText('How this estimate was calculated').focus();
  await page.keyboard.press('Enter');
  await expect(progress.getByText(/Model estimate: 53%/)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
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
});
