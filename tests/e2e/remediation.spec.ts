import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Question } from '../../packages/question-bank/src/index';

test('teacher assigns targeted practice and the student completes the linked question', async ({
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
    .getByRole('button', { name: 'Distribution error', exact: true })
    .click();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check/ }).click();
  await expect(page.getByText('FIRST DIVERGENCE · STEP 2')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await expect(
    page.getByRole('button', { name: 'Assign recommended practice' }),
  ).toHaveCount(0);
  await page
    .getByLabel('Review explanation')
    .fill(
      'Practice arithmetic prerequisites before distributing to every term.',
    );
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await page
    .getByRole('button', { name: 'Assign recommended practice' })
    .click();
  await expect(
    page.getByText('Focused practice assigned to this student.', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Assign recommended practice' }),
  ).toHaveCount(0);
  const teacherAssignments = (await (
    await page.request.get('/api/assignments')
  ).json()) as { title: string; question: Question }[];
  const practice = teacherAssignments.find((a) =>
    a.title.startsWith('Focused practice:'),
  )!;
  expect(practice.question.skillId).toBe('arithmetic-expressions');
  await page.getByRole('button', { name: 'Switch to student' }).click();
  await expect(
    page.getByRole('button', { name: /Focused practice:/ }),
  ).toHaveCount(1);
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await page.getByRole('button', { name: 'Open focused practice' }).click();
  await expect(
    page.getByText(/Your teacher requested targeted practice/),
  ).toBeVisible();
  for (const [index, line] of practice.question.reference.entries()) {
    if (index)
      await page
        .getByRole('button', { name: '+ Add a step', exact: true })
        .click();
    await page.getByLabel(`Step ${index + 1}`, { exact: true }).fill(line);
  }
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check/ }).click();
  await expect(page.getByText('A COMPLETE, CONSISTENT SOLUTION')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page.getByRole('button', { name: /Focused practice:/ }).click();
  await page.getByLabel('Teacher decision').selectOption('correct');
  await page
    .getByLabel('Review explanation')
    .fill('The targeted prerequisite question is complete and correct.');
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(
    page
      .getByRole('region', { name: 'Reviewed skill progress' })
      .getByText('1 reviewed attempt · 1 correct'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Switch to student' }).click();
  await page.reload();
  await page.getByRole('button', { name: /Focused practice:/ }).click();
  await expect(
    page
      .getByRole('region', { name: 'Reviewed skill progress' })
      .getByText('1 reviewed attempt · 1 correct'),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: 'artifacts/remediation-workspace.png',
    fullPage: true,
  });
});
