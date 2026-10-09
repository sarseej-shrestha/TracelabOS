import { test, expect, type Page } from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import sharp from 'sharp';
async function workspace(page: Page, mode = 'success') {
  await page.request.post('http://127.0.0.1:8031/mode', { data: { mode } });
  await page.goto('/');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  const image = await sharp(
    Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="180"><rect width="600" height="180" fill="white"/><text x="20" y="65" font-size="36">3(x-2)=15</text><text x="20" y="125" font-size="36">3x-2=15</text></svg>',
    ),
  )
    .png()
    .toBuffer();
  await page.getByLabel('Choose a photo').setInputFiles({
    name: 'controlled-typeset-fixture.png',
    mimeType: 'image/png',
    buffer: image,
  });
  await page.getByRole('button', { name: 'Save photo', exact: true }).click();
  await expect(page.getByText(/Photo saved privately/)).toBeVisible();
}
test.afterEach(async ({ request }) => {
  await request.post('http://127.0.0.1:8031/mode', {
    data: { mode: 'success' },
  });
});
test('queued extraction preserves original output, requires correction confirmation and remains inspectable by the teacher', async ({
  page,
}) => {
  await workspace(page);
  await page.getByRole('checkbox').check();
  const queued = page.waitForResponse(
    (r) => r.url().endsWith('/process') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Extract handwritten steps' }).click();
  const response = await queued;
  expect(response.status()).toBe(202);
  const submissionId = new URL(response.url()).pathname.split('/')[3]!;
  await expect(
    page.getByText('CHECK TRANSCRIPTION', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Step 2', { exact: true })).toHaveValue(
    '3x-2=15',
  );
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await expect(
    page.getByRole('button', { name: /Confirm & check steps/ }),
  ).toBeDisabled();
  const snapshot = await (
    await page.request.get(`/api/submissions/${submissionId}`)
  ).json();
  expect(snapshot.evaluation).toBeNull();
  expect(snapshot.ocrJob.status).toBe('SUCCEEDED');
  await page
    .getByText('Original machine transcription', { exact: true })
    .click();
  await expect(page.locator('.ocr-original code').nth(1)).toHaveText('3x-2=15');
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  for (const [index, line] of [
    '3(x-2)=15',
    '3x-6=15',
    '3x=21',
    'x=7',
  ].entries())
    await page.getByLabel(`Step ${index + 1}`, { exact: true }).fill(line);
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check steps/ }).click();
  await expect(page.getByText('A COMPLETE, CONSISTENT SOLUTION')).toBeVisible();
  await page.screenshot({
    path: 'artifacts/ocr-confirmation-workspace.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await page
    .getByText('Original machine transcription', { exact: true })
    .click();
  await expect(page.locator('.ocr-original code').nth(1)).toHaveText('3x-2=15');
  await page.getByLabel('Teacher decision').selectOption('correct');
  await page
    .getByLabel('Review explanation')
    .fill('Verified the corrected distribution against the submitted work.');
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(page.getByText('FINALIZED', { exact: true })).toBeVisible();
});
test('invalid extraction offers manual fallback with no automatic grade', async ({
  page,
}) => {
  await workspace(page, 'invalid');
  await page.getByRole('button', { name: 'Extract handwritten steps' }).click();
  await expect(
    page.getByText(
      'Extraction failed. Enter your steps manually or try again.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Retry extraction' }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Enter steps manually' }).click();
  await page.getByLabel('Step 1', { exact: true }).fill('x=7');
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check steps/ }).click();
  await expect(page.getByText('A COMPLETE, CONSISTENT SOLUTION')).toBeVisible();
});
test('cancelling an in-flight extraction retains the saved draft and rejects late output', async ({
  page,
}) => {
  await workspace(page, 'slow');
  await page.getByLabel('Step 1', { exact: true }).fill('x=5');
  await page.getByRole('button', { name: 'Extract handwritten steps' }).click();
  await expect(page.getByText(/Reading your handwriting/)).toBeVisible();
  await page.getByRole('button', { name: 'Enter steps manually' }).click();
  await expect(page.getByLabel('Step 1', { exact: true })).toHaveValue('x=5');
  await page.waitForTimeout(2800); // Let the deliberately delayed provider finish after cancellation.
  await expect(page.getByLabel('Step 1', { exact: true })).toHaveValue('x=5');
  await expect(
    page.getByText('Original machine transcription', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: /Confirm & check steps/ }),
  ).toBeDisabled();
});
