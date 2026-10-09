import { readFile, writeFile } from 'node:fs/promises';
import { configuredVisionProvider } from '../packages/vision-adapter/src/http.ts';
import { extract } from '../packages/vision-adapter/src/index.ts';
const provider = configuredVisionProvider();
if (!provider || !process.argv[2])
  throw new Error(
    'Configure OCR and provide a non-sensitive research image path',
  );
const bytes = new Uint8Array(await readFile(process.argv[2]));
const unauthorized = await fetch(process.env.TRACELAB_OCR_URL!, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: '{}',
});
if (unauthorized.status !== 401)
  throw new Error('Provider must require authentication');
const started = performance.now();
const result = await extract(provider, bytes, 'research-smoke', 30000);
if (!result.ok) throw new Error(`OCR_SMOKE_FAILED: ${result.code}`);
const report = {
  executedAt: new Date().toISOString(),
  unauthorizedStatus: unauthorized.status,
  authorizedExtraction: true,
  durationMs: performance.now() - started,
  result: result.data,
  gradingPerformed: false,
  scope:
    'Provider smoke only; not a production accuracy or photographed-work acceptance test',
};
await writeFile(
  'artifacts/ocr-service-smoke.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    authorizedExtraction: true,
    lines: result.data.lines.length,
    gradingPerformed: false,
  }),
);
