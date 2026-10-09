import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('visitor confirms a solution, inspects propagation, and records teacher review', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'A wrong answer. A useful beginning.' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await page
    .getByRole('button', { name: 'Distribution error', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: /Confirm & check/ }),
  ).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check/ }).click();
  await expect(page.getByText('FIRST DIVERGENCE · STEP 2')).toBeVisible();
  await expect(page.getByText('PROPAGATED ERROR', { exact: true })).toHaveCount(
    2,
  );
  await page.screenshot({
    path: 'artifacts/student-reasoning.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await page
    .getByLabel('Review explanation')
    .fill(
      'The student applied distribution to only the first term. Practice both terms.',
    );
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Teacher review history' }),
  ).toBeVisible();
  await expect(page.getByText('FINALIZED', { exact: true })).toBeVisible();
  await page.screenshot({
    path: 'artifacts/teacher-studio.png',
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test('landing and student workspace pass automated accessibility checks', async ({
  page,
}) => {
  await page.goto('/');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await expect(page.getByRole('checkbox')).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test('mobile workspace has no horizontal overflow and supports correct solution', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
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
  await expect(page.getByText('A COMPLETE, CONSISTENT SOLUTION')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'artifacts/mobile-workspace.png',
    fullPage: true,
  });
});
