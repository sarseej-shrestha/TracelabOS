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

test('a generated expression can be simplified and completed through the student workspace', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByText('Create a classroom or publish an assignment', { exact: true })
    .click();
  await page.getByLabel('Title', { exact: true }).fill('Collect the x terms');
  await page
    .getByRole('combobox', { name: 'Skill', exact: true })
    .selectOption('combine-like-terms');
  await page.getByLabel('Variation seed').fill('0');
  await page.getByLabel('Feedback release').selectOption('immediate');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.algebra-figure svg')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Publish assignment', exact: true })
    .click();
  await expect(
    page.getByText('Assignment published.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to student' }).click();
  await page.getByRole('button', { name: /Collect the x terms/ }).click();
  const q = generateQuestion('combine-like-terms', 0, 'intro');
  await expect(
    page.getByRole('img', { name: `Expression: ${q.expression}`, exact: true }),
  ).toBeVisible();
  for (const [index, line] of q.reference.entries()) {
    if (index)
      await page
        .getByRole('button', { name: '+ Add a step', exact: true })
        .click();
    await page.getByLabel(`Step ${index + 1}`, { exact: true }).fill(line);
  }
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check steps/ }).click();
  await expect(page.getByText('A COMPLETE, CONSISTENT SOLUTION')).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: 'artifacts/algebra-workspace.png',
    fullPage: true,
  });
});

test('positive proportions show a ratio table and preserve denominator conditions after confirmation', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByText('Create a classroom or publish an assignment', { exact: true })
    .click();
  await page
    .getByLabel('Title', { exact: true })
    .fill('Solve a positive proportion');
  await page
    .getByRole('combobox', { name: 'Skill', exact: true })
    .selectOption('solve-proportions');
  await page.getByLabel('Variation seed').fill('0');
  await page.getByLabel('Feedback release').selectOption('immediate');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.ratio-figure table')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Publish assignment', exact: true })
    .click();
  await expect(
    page.getByText('Assignment published.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to student' }).click();
  await page
    .getByRole('button', { name: /Solve a positive proportion/ })
    .click();
  const q = generateQuestion('solve-proportions', 0, 'intro');
  await expect(page.locator('.ratio-figure table')).toBeVisible();
  for (const [index, line] of q.reference.entries()) {
    if (index)
      await page
        .getByRole('button', { name: '+ Add a step', exact: true })
        .click();
    await page.getByLabel(`Step ${index + 1}`, { exact: true }).fill(line);
  }
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check steps/ }).click();
  await expect(page.getByText('A COMPLETE, CONSISTENT SOLUTION')).toBeVisible();
  await expect(
    page.getByText(
      'Domain condition: x > 0; every denominator must be nonzero.',
      { exact: true },
    ),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: 'artifacts/ratio-workspace.png',
    fullPage: true,
  });
});

test('composite geometry uses known dimensions and completes with square units on mobile', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByText('Create a classroom or publish an assignment', { exact: true })
    .click();
  await page
    .getByLabel('Title', { exact: true })
    .fill('Decompose the missing corner');
  await page
    .getByRole('combobox', { name: 'Skill', exact: true })
    .selectOption('composite-area');
  await page.getByLabel('Variation seed').fill('0');
  await page.getByLabel('Feedback release').selectOption('immediate');
  await page.getByRole('button', { name: 'Preview', exact: true }).click();
  await expect(page.locator('.geometry-figure svg')).toHaveCount(1);
  await page
    .getByRole('button', { name: 'Publish assignment', exact: true })
    .click();
  await expect(
    page.getByText('Assignment published.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to student' }).click();
  await page
    .getByRole('button', { name: /Decompose the missing corner/ })
    .click();
  const q = generateQuestion('composite-area', 0, 'intro');
  await expect(page.locator('.geometry-figure svg')).toBeVisible();
  for (const [index, line] of q.reference.entries()) {
    if (index)
      await page
        .getByRole('button', { name: '+ Add a step', exact: true })
        .click();
    await page.getByLabel(`Step ${index + 1}`, { exact: true }).fill(line);
  }
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check steps/ }).click();
  await expect(page.getByText('A COMPLETE, CONSISTENT SOLUTION')).toBeVisible();
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
  await page.screenshot({
    path: 'artifacts/geometry-mobile-workspace.png',
    fullPage: true,
  });
});
test('area unit error remains in automatic history after a teacher accepts the original work', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByText('Create a classroom or publish an assignment', { exact: true })
    .click();
  await page.getByLabel('Title', { exact: true }).fill('Check square units');
  await page
    .getByRole('combobox', { name: 'Skill', exact: true })
    .selectOption('rectangle-area');
  await page.getByLabel('Variation seed').fill('0');
  await page.getByLabel('Feedback release').selectOption('immediate');
  await page
    .getByRole('button', { name: 'Publish assignment', exact: true })
    .click();
  await expect(
    page.getByText('Assignment published.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to student' }).click();
  await page.getByRole('button', { name: /Check square units/ }).click();
  const q = generateQuestion('rectangle-area', 0, 'intro');
  await page
    .getByLabel('Step 1', { exact: true })
    .fill(q.reference.at(-1)!.replace('cm²', 'cm'));
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check steps/ }).click();
  await expect(page.getByText('FIRST DIVERGENCE · STEP 1')).toBeVisible();
  await expect(
    page.getByText(
      'This step changes the dimension. Perimeter is a length; area uses square units.',
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page.getByRole('button', { name: /Check square units/ }).click();
  await page.getByLabel('Teacher decision').selectOption('correct');
  await page
    .getByLabel('Review explanation')
    .fill(
      'Original paper has square units; the transcription missed its exponent.',
    );
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(page.getByText('FINALIZED', { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole('paragraph')
      .filter({
        hasText:
          'Original paper has square units; the transcription missed its exponent.',
      }),
  ).toBeVisible();
  await expect(page.getByText('FIRST DIVERGENCE · STEP 1')).toBeVisible();
});
