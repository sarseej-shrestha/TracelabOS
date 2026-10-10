import { test, expect } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('teacher replays recorded states and corrected reviews with keyboard controls', async ({
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
  await page
    .getByLabel('Review explanation')
    .fill('Practice distributing to both terms.');
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  const replay = page.getByRole('region', { name: 'Classroom time machine' });
  const summary = page.getByRole('status', { name: 'Reconstructed progress' });
  await expect(summary).toContainText('FINALIZED: 1');
  await expect(summary).toContainText('needs practice: 1');
  const slider = page.getByRole('slider', { name: /Replay position/ });
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(summary).toContainText(
    '0 published assignments · 0 observed submissions',
  );
  await page.keyboard.press('ArrowRight');
  await expect(summary).toContainText(
    '1 published assignments · 0 observed submissions',
  );
  await page.keyboard.press('ArrowRight');
  await expect(summary).toContainText('MANUAL ENTRY: 1');
  await page.keyboard.press('ArrowRight');
  await expect(summary).toContainText('CONFIRMED: 1');
  await page.keyboard.press('ArrowRight');
  await expect(summary).toContainText('EVALUATED: 1');
  await expect(summary).toContainText('No released reviews yet.');
  await page.keyboard.press('End');
  await expect(summary).toContainText('needs practice: 1');
  await page.getByLabel('Teacher decision').selectOption('correct');
  await page
    .getByLabel('Review explanation')
    .fill('Teacher correction after inspecting the original work.');
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(summary).toContainText('correct: 1');
  await expect(summary).not.toContainText('needs practice: 1');
  await slider.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(summary).toContainText('needs practice: 1');
  await page.keyboard.press('End');
  await replay
    .getByText('Events through this position', { exact: true })
    .click();
  await expect(
    replay.getByText('feedback released', { exact: true }),
  ).toHaveCount(2);
  await expect(replay.getByRole('note')).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[aria-labelledby="replay-heading"]')
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: 'artifacts/classroom-replay-mobile.png',
    fullPage: true,
  });
  await page.reload();
  await expect(summary).toContainText('correct: 1');
  await expect(summary).toContainText('1 observed submissions');
});
