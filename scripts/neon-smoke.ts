/** Explicit, non-destructive hosted check. Creates isolated fictional demo records. */
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { openPostgres } from '../packages/database/src/postgres.ts';
import {
  applyMigration,
  migrationFiles,
} from '../packages/database/src/migrations.ts';
import { configuredImageStore } from '../packages/vision-adapter/src/storage.ts';
import { createApp } from '../services/api/src/app.ts';

if (!process.env.DATABASE_URL || !process.argv.includes('--write-demo'))
  throw Error(
    'Set DATABASE_URL and pass --write-demo; creates fictional records',
  );
const connection = process.env.DATABASE_URL;
const imageStore = configuredImageStore();
let db = openPostgres(connection);
let app = createApp(db, {
  allowedOrigins: ['https://tracelab.test'],
  imageStore,
});
let cookie = '';
const checks: string[] = [];
async function request(
  path: string,
  body?: unknown,
  method = body ? 'POST' : 'GET',
) {
  const response = await app.request(`https://tracelab.test/api${path}`, {
    method,
    headers: {
      origin: 'https://tracelab.test',
      'content-type': 'application/json',
      cookie,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  assert.equal(response.ok, true, `API ${method} ${path}: ${response.status}`);
  const session = response.headers.get('set-cookie');
  if (session) {
    assert.match(session, /HttpOnly/i);
    assert.match(session, /Secure/i);
    assert.match(session, /SameSite=Strict/i);
    cookie = session.split(';')[0]!;
  }
  return response.json();
}
try {
  // This command does not initialize an unknown database: migrations must exist.
  const ledger = await db
    .prepare('SELECT version,checksum FROM schema_migrations ORDER BY version')
    .all();
  assert.equal(ledger.length, migrationFiles.length);
  for (const [index, file] of migrationFiles.entries()) {
    const sql = await readFile(
      new URL(`../packages/database/migrations/${file}`, import.meta.url),
      'utf8',
    );
    assert.equal(await applyMigration(db, index + 1, sql), false);
  }
  checks.push('five migration checksums match; repeat applies no changes');
  const constraints = await db
    .prepare(
      "SELECT contype, CAST(COUNT(*) AS INTEGER) n FROM pg_constraint WHERE connamespace='public'::regnamespace GROUP BY contype ORDER BY contype",
    )
    .all();
  const indexes = await db
    .prepare(
      "SELECT indexname FROM pg_indexes WHERE schemaname='public' ORDER BY indexname",
    )
    .all();
  assert.ok(constraints.some((c) => c.contype === 'f' && Number(c.n) > 0));
  assert.ok(indexes.some((i) => i.indexname === 'events_classroom_sequence'));
  checks.push('foreign keys and classroom event index present');
  const d = await request('/demo', {});
  const { id } = await request('/submissions', { assignmentId: d.assignment });
  assert.equal(
    (await request('/submissions', { assignmentId: d.assignment })).id,
    id,
  );
  const png = await sharp({
    create: { width: 40, height: 40, channels: 3, background: '#fff' },
  })
    .png()
    .toBuffer();
  const upload = await app.request(
    `https://tracelab.test/api/submissions/${id}/image`,
    {
      method: 'POST',
      headers: {
        origin: 'https://tracelab.test',
        cookie,
        'content-type': 'image/png',
      },
      body: new Uint8Array(png),
    },
  );
  assert.equal(upload.status, 200);
  assert.equal((await request(`/submissions/${id}`)).evaluation, null);
  checks.push(
    'idempotent submission; controlled image stored; no unconfirmed grade',
  );
  const edited = await request(
    `/submissions/${id}/transcription`,
    {
      version: 1,
      lines: ['3(x-2)=15', '3x-2=15', '3x=17', 'x=17/3'],
    },
    'PATCH',
  );
  await request(`/submissions/${id}/confirm`, {
    version: edited.version,
    confirmed: true,
  });
  await request(`/submissions/${id}/confirm`, {
    version: edited.version,
    confirmed: true,
  });
  assert.equal((await request(`/submissions/${id}`)).evaluation.firstError, 2);
  assert.equal(
    Number(
      (
        await db
          .prepare('SELECT COUNT(*) n FROM evaluations WHERE submission_id=?')
          .get(id)
      )?.n,
    ),
    1,
  );
  checks.push(
    'confirmed first-error grading; repeated confirmation preserves one evaluation',
  );
  await request('/demo/role', { role: 'teacher' });
  const teacherCookie = cookie;
  await request(`/submissions/${id}/reviews`, {
    decision: 'needs_practice',
    reason: 'Fictional cloud verification: distribute to both terms.',
  });
  assert.equal((await request(`/submissions/${id}`)).state, 'FINALIZED');
  checks.push('authorized teacher review finalizes submission');
  cookie = '';
  await request('/demo', {});
  const foreignCookie = cookie;
  for (const [session, expected] of [
    ['', 401],
    [foreignCookie, 404],
  ] as const) {
    const response = await app.request(
      `https://tracelab.test/api/submissions/${id}/image`,
      { headers: { cookie: session } },
    );
    assert.equal(response.status, expected);
  }
  await request('/demo/role', { role: 'teacher' });
  assert.equal(
    (
      await app.request(
        `https://tracelab.test/api/classrooms/${d.room}/events`,
        { headers: { cookie } },
      )
    ).status,
    404,
  );
  checks.push(
    'anonymous and foreign image access denied; foreign teacher classroom denied',
  );
  await db.close();
  db = openPostgres(connection);
  app = createApp(db, {
    allowedOrigins: ['https://tracelab.test'],
    imageStore,
  });
  cookie = teacherCookie;
  assert.equal((await request('/me')).role, 'teacher');
  assert.equal((await request(`/submissions/${id}`)).state, 'FINALIZED');
  const events = await request(`/classrooms/${d.room}/events`);
  assert.ok(
    events.some((e: { type: string }) => e.type === 'EVALUATION_COMPLETED'),
  );
  const image = await app.request(
    `https://tracelab.test/api/submissions/${id}/image`,
    { headers: { cookie: teacherCookie } },
  );
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('cache-control'), 'private, no-store');
  assert.equal(
    (await sharp(new Uint8Array(await image.arrayBuffer())).metadata()).format,
    'jpeg',
  );
  checks.push(
    'fresh connection preserves sessions, review, events and authorized normalized image',
  );
  const report = {
    executedAt: new Date().toISOString(),
    persistence: db.kind,
    imageStorage: imageStore?.kind ?? 'private-database',
    checks,
    migrationCount: ledger.length,
    constraints,
    indexCount: indexes.length,
    fixture:
      'Two isolated fictional demo spaces; generated blank image; records retained for inspection.',
    limitations:
      'Real Neon transport with in-process Hono requests. Not Worker deployment or browser verification. Image storage provider is reported separately; no deployment claim. No OCR accuracy claim.',
  };
  await writeFile(
    imageStore
      ? 'artifacts/neon-storage-workflow-smoke.json'
      : 'artifacts/neon-cloud-smoke.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  // Driver errors can contain connection information; emit only a safe class/code.
  console.error(
    JSON.stringify({
      status: 'failed',
      completedChecks: checks,
      errorType: error instanceof Error ? error.name : 'unknown',
    }),
  );
  process.exitCode = 1;
} finally {
  await db.close();
}
