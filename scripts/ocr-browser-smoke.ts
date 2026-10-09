import { chromium, expect } from 'playwright/test';
import { writeFile } from 'node:fs/promises';
if (!process.argv[2])
  throw Error(
    'Pass a non-sensitive image path; start the actual local API, OCR service and worker first',
  );
const browser = await chromium.launch({
  headless: true,
  ...(process.env.CHROMIUM_PATH
    ? { executablePath: process.env.CHROMIUM_PATH }
    : {}),
});
const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
const started = performance.now();
try {
  await page.goto('http://127.0.0.1:3000');
  await page
    .getByRole('button', { name: 'Debug a student’s thinking' })
    .click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await page.getByLabel('Choose a photo').setInputFiles(process.argv[2]);
  await page.getByRole('button', { name: 'Save photo', exact: true }).click();
  await expect(page.getByText(/Photo saved privately/)).toBeVisible();
  const queued = page.waitForResponse(
    (r) => r.url().endsWith('/process') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Extract handwritten steps' }).click();
  const response = await queued;
  expect(response.status()).toBe(202);
  const id = new URL(response.url()).pathname.split('/')[3]!;
  await expect(
    page.getByText('CHECK TRANSCRIPTION', { exact: true }),
  ).toBeVisible({ timeout: 60000 });
  const extracted = await (
    await page.request.get(`http://127.0.0.1:3000/api/submissions/${id}`)
  ).json();
  expect(extracted.evaluation).toBeNull();
  expect(extracted.ocrJob.status).toBe('SUCCEEDED');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  const fixture = ['3(x-2)=15', '3x-2=15', '3x=17', 'x=17/3'];
  while ((await page.getByLabel(/^Step \d+$/).count()) > fixture.length)
    await page
      .getByRole('button', { name: /Remove step/ })
      .last()
      .click();
  for (const [index, line] of fixture.entries()) {
    if ((await page.getByLabel(/^Step \d+$/).count()) <= index)
      await page
        .getByRole('button', { name: '+ Add a step', exact: true })
        .click();
    await page.getByLabel(`Step ${index + 1}`, { exact: true }).fill(line);
  }
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: /Confirm & check steps/ }).click();
  await expect(page.getByText('FIRST DIVERGENCE · STEP 2')).toBeVisible();
  await page.getByRole('button', { name: 'Switch to teacher' }).click();
  await page
    .getByRole('button', { name: /The distribution detective/ })
    .click();
  await page
    .getByText('Original machine transcription', { exact: true })
    .click();
  await expect(page.locator('.ocr-original code')).toHaveCount(
    extracted.lines.length,
  );
  await page
    .getByLabel('Review explanation')
    .fill(
      'Integration smoke: confirmed correction exposes distribution error; practice both terms.',
    );
  await page
    .getByRole('button', { name: 'Record review & release feedback' })
    .click();
  await expect(page.getByText('FINALIZED', { exact: true })).toBeVisible();
  const report = {
    executedAt: new Date().toISOString(),
    modelVersion: extracted.ocrJob.provider_version,
    originalLineCount: extracted.lines.length,
    unconfirmedEvaluation: extracted.evaluation,
    finalState: 'FINALIZED',
    durationMs: performance.now() - started,
    limitations:
      'Actual model and browser workflow. Known demo steps deliberately replace recognition; this is not image/question agreement or camera-photo accuracy. Input provenance is in vault Test-Results.',
  };
  await writeFile(
    'artifacts/ocr-browser-smoke.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
