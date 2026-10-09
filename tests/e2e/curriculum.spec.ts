import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { generateQuestion } from '../../packages/question-bank/src/index';
test('teacher previews fraction bars and student completes a generated division assignment on mobile', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page.getByRole('button', { name: 'Skill library' }).click();
  await expect(
    page.getByRole('heading', { name: 'Divide by a fraction', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page.getByRole('button', { name: 'Classroom studio' }).click();
  await page
    .getByText('Create a classroom or publish an assignment', { exact: true })
    .click();
  await page
    .getByLabel('Title', { exact: true })
    .fill('Fraction division visual practice');
  await page
    .getByRole('combobox', { name: 'Skill', exact: true })
    .selectOption('fraction-division');
  await page.getByLabel('Variation seed').fill('14');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  const q = generateQuestion('fraction-division', 14, 'intro');
  await expect(page.getByText(q.expression, { exact: true })).toBeVisible();
  await expect(page.locator('.fraction-figure svg')).toHaveCount(2);
  await page
    .getByRole('button', { name: 'Publish assignment', exact: true })
    .click();
  await expect(
    page.getByText('Assignment published.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to student' }).click();
  await page.getByRole('button', { name: 'My assignments' }).click();
  await page
    .getByRole('button', { name: /Fraction division visual practice/ })
    .click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.fraction-figure svg')).toHaveCount(2);
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
  for (const [index, line] of q.reference.entries()) {
    if (index)
      await page
        .getByRole('button', { name: '+ Add a step', exact: true })
        .click();
    await page.getByLabel(`Step ${index + 1}`, { exact: true }).fill(line);
  }
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check steps/ }).click();
  await expect(
    page.getByText(
      'Your work has been saved. Your teacher will release feedback after reviewing it.',
    ),
  ).toBeVisible();
  await page.screenshot({
    path: 'artifacts/fraction-mobile-workspace.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByRole('button', { name: /Fraction division visual practice/ })
    .click();
  await expect(page.getByText('A COMPLETE, CONSISTENT SOLUTION')).toBeVisible();
});
