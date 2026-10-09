import { readFile, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../packages/database/src/local.ts';
import { asDatabase } from '../packages/database/src/adapter.ts';
import { configuredVisionProvider } from '../packages/vision-adapter/src/http.ts';
import { createApp } from '../services/api/src/app.ts';
import { runOcrJob } from '../services/api/src/ocr.ts';
const provider = configuredVisionProvider();
if (!provider || !process.argv[2])
  throw Error('Configure the provider and pass a non-sensitive image path');
const db = asDatabase(openDatabase(':memory:'));
const app = createApp(db, { visionProvider: provider });
let cookie = '';
async function call(
  path: string,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
) {
  const response = await app.request(`http://localhost/api${path}`, {
    method,
    headers: {
      origin: 'http://localhost',
      'content-type': 'application/json',
      cookie,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw Error(`${path}: ${response.status}`);
  if (response.headers.has('set-cookie'))
    cookie = response.headers.get('set-cookie')!.split(';')[0]!;
  return response.json();
}
try {
  const demo = await call('/demo', {});
  const { id } = await call('/submissions', { assignmentId: demo.assignment });
  const bytes = await readFile(process.argv[2]);
  const image = await app.request(
    `http://localhost/api/submissions/${id}/image`,
    {
      method: 'POST',
      headers: {
        origin: 'http://localhost',
        'content-type': bytes[0] === 137 ? 'image/png' : 'image/jpeg',
        cookie,
      },
      body: bytes,
    },
  );
  if (!image.ok) throw Error(`Image: ${image.status}`);
  await call(`/submissions/${id}/process`, {
    version: 1,
    idempotencyKey: randomUUID(),
  });
  const start = performance.now();
  await runOcrJob(db, provider);
  const duration = performance.now() - start;
  const extracted = await call(`/submissions/${id}`);
  if (
    extracted.state !== 'CONFIRMATION_REQUIRED' ||
    extracted.evaluation !== null
  )
    throw Error('Expected ungraded extraction');
  // Deliberate correction demonstrates the workflow, not recognition accuracy of this sample.
  const saved = await call(
    `/submissions/${id}/transcription`,
    {
      version: extracted.version,
      lines: ['3(x-2)=15', '3x-2=15', '3x=17', 'x=17/3'],
    },
    'PATCH',
  );
  await call(`/submissions/${id}/confirm`, {
    version: saved.version,
    confirmed: true,
  });
  const graded = await call(`/submissions/${id}`);
  if (!graded.evaluation || graded.evaluation.firstError !== 2)
    throw Error('Expected corrected distribution error');
  await call('/demo/role', { role: 'teacher' });
  await call(`/submissions/${id}/reviews`, {
    decision: 'needs_practice',
    reason: 'Smoke fixture: practice distributing to both terms.',
  });
  const reviewed = await call(`/submissions/${id}`);
  if (reviewed.state !== 'FINALIZED') throw Error('Review did not finalize');
  const report = {
    executedAt: new Date().toISOString(),
    provider: provider.version,
    inputKind: 'User-supplied research image; consult invocation provenance',
    extractedLineCount: extracted.lines.length,
    processingDurationMs: duration,
    unconfirmedEvaluation: extracted.evaluation,
    correctedFixtureFirstError: graded.evaluation.firstError,
    finalState: reviewed.state,
    limitations:
      'A deliberate replacement with known demo steps tests correction and grading. This is not image/question agreement, OCR accuracy, or photographed-work acceptance.',
  };
  await writeFile(
    'artifacts/ocr-workflow-smoke.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await db.close();
}
