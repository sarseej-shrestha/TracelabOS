import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import {
  asDatabase,
  type Database,
} from '../../packages/database/src/adapter.ts';
import { openDatabase } from '../../packages/database/src/local.ts';
import { testPostgres } from '../helpers/postgres.ts';
import { createApp } from '../../services/api/src/app.ts';
import {
  claimOcr,
  completeOcr,
  runOcrJob,
} from '../../services/api/src/ocr.ts';
import type {
  VisionProvider,
  Extraction,
} from '../../packages/vision-adapter/src/index.ts';
const provider: VisionProvider = {
  version: 'controlled-test-v1',
  transcribe: async (_image, _signal, questionId) => ({
    questionId,
    modelVersion: 'controlled-test-v1',
    status: 'needs_confirmation',
    lines: [{ line: 1, raw: 'x=7', latex: 'x=7' }],
  }),
};
describe.each(['sqlite', 'postgres'] as const)('%s durable OCR', (engine) => {
  let db: Database,
    app: ReturnType<typeof createApp>,
    id: string,
    cookie: string;
  beforeAll(async () => {
    db =
      engine === 'sqlite'
        ? asDatabase(openDatabase(':memory:'))
        : (await testPostgres()).db;
  });
  afterAll(() => db.close());
  const call = (
    path: string,
    body?: unknown,
    method = body === undefined ? 'GET' : 'POST',
    session = cookie,
  ) =>
    app.request(`http://localhost/api${path}`, {
      method,
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
        cookie: session,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  beforeEach(async () => {
    await db.prepare('DELETE FROM ocr_jobs').run();
    app = createApp(db, { visionProvider: provider });
    const demo = await call('/demo', {}, 'POST', '');
    cookie = demo.headers.get('set-cookie')!.split(';')[0]!;
    id = (
      await (
        await call('/submissions', {
          assignmentId: (await demo.json()).assignment,
        })
      ).json()
    ).id;
    await db
      .prepare('INSERT INTO submission_images VALUES(?,?,?)')
      .run(id, 'image/jpeg', new Uint8Array([1, 2, 3]));
  });
  const enqueue = (key = randomUUID(), version = 1) =>
    call(`/submissions/${id}/process`, { version, idempotencyKey: key });
  const view = async () => (await call(`/submissions/${id}`)).json();
  const rows = () =>
    db.prepare('SELECT * FROM ocr_jobs WHERE submission_id=?').all(id);
  async function success(): Promise<Extraction> {
    const q = await db
      .prepare(
        'SELECT a.question FROM assignments a JOIN submissions s ON s.assignment_id=a.id WHERE s.id=?',
      )
      .get(id);
    return {
      ok: true,
      data: (await provider.transcribe(
        new Uint8Array(),
        new AbortController().signal,
        JSON.parse(q!.question as string).id,
      )) as Extract<Extraction, { ok: true }>['data'],
    };
  }
  it('persists OCR provenance and requires explicit confirmation before evaluation', async () => {
    expect((await enqueue()).status).toBe(202);
    expect(
      (
        await call(`/submissions/${id}/confirm`, {
          version: 1,
          confirmed: true,
        })
      ).status,
    ).toBe(409);
    expect(await runOcrJob(db, provider)).toBe(true);
    expect(await view()).toMatchObject({
      state: 'CONFIRMATION_REQUIRED',
      version: 2,
      lines: ['x=7'],
      evaluation: null,
      ocrJob: { status: 'SUCCEEDED', attempts: 1 },
    });
    expect(JSON.parse((await rows())[0]!.raw_output as string)).toMatchObject({
      modelVersion: provider.version,
      lines: [{ raw: 'x=7' }],
    });
    expect(
      (
        await call(
          `/submissions/${id}/transcription`,
          { version: 2, lines: ['x=8'] },
          'PATCH',
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(`/submissions/${id}/confirm`, {
          version: 3,
          confirmed: true,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await db
          .prepare(
            'SELECT source,lines FROM transcription_versions WHERE submission_id=? ORDER BY version',
          )
          .all(id)
      ).map((x) => x.source),
    ).toEqual(['manual', 'ocr', 'student']);
    expect(
      JSON.parse((await rows())[0]!.raw_output as string).lines[0].raw,
    ).toBe('x=7');
    expect(await view()).toMatchObject({
      version: 3,
      evaluation: expect.any(Object),
    });
  });
  it('replays the same key without another job and rejects conflicting payloads', async () => {
    const key = randomUUID();
    const first = await (await enqueue(key)).json();
    expect(await (await enqueue(key)).json()).toMatchObject({
      id: first.id,
      idempotent: true,
    });
    expect((await enqueue(key, 2)).status).toBe(409);
    expect((await rows()).length).toBe(1);
  });
  it('authorizes owners for processing, cancellation, raw output and images', async () => {
    const other = await call('/demo', {}, 'POST', '');
    const stranger = other.headers.get('set-cookie')!.split(';')[0]!;
    for (const path of ['process', 'manual-entry'])
      expect(
        (
          await call(
            `/submissions/${id}/${path}`,
            { version: 1, idempotencyKey: randomUUID() },
            'POST',
            stranger,
          )
        ).status,
      ).toBe(404);
    expect(
      (await call(`/submissions/${id}`, undefined, 'GET', stranger)).status,
    ).toBe(404);
    expect(
      (await call(`/submissions/${id}/process`, {}, 'POST', '')).status,
    ).toBe(401);
  });
  it('requires a configured provider, an image and current version', async () => {
    app = createApp(db);
    expect((await enqueue()).status).toBe(503);
    app = createApp(db, { visionProvider: provider });
    expect((await enqueue(randomUUID(), 2)).status).toBe(409);
    await db
      .prepare('DELETE FROM submission_images WHERE submission_id=?')
      .run(id);
    expect((await enqueue()).status).toBe(400);
    expect((await rows()).length).toBe(0);
  });
  it('limits persisted attempts per student independently of request process restarts', async () => {
    for (let i = 0; i < 5; i++) {
      expect((await enqueue()).status).toBe(202);
      expect(
        (await call(`/submissions/${id}/manual-entry`, { version: 1 })).status,
      ).toBe(200);
    }
    app = createApp(db, { visionProvider: provider });
    const response = await enqueue();
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({
      error: 'OCR_QUOTA_EXHAUSTED',
    });
  });
  it('claims once under concurrent workers and blocks transcript writes during processing', async () => {
    await enqueue();
    const claims = await Promise.all([
      claimOcr(db, provider.version),
      claimOcr(db, provider.version),
    ]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(
      (
        await call(
          `/submissions/${id}/transcription`,
          { version: 1, lines: ['x=3'] },
          'PATCH',
        )
      ).status,
    ).toBe(409);
  });
  it('cancels without losing manual work and rejects a late inference result', async () => {
    await enqueue();
    const job = (await claimOcr(db, provider.version))!;
    await call(`/submissions/${id}/manual-entry`, { version: 1 });
    expect(await completeOcr(db, job, await success())).toBe(false);
    expect(await view()).toMatchObject({
      state: 'MANUAL_ENTRY',
      version: 1,
      ocrJob: { status: 'CANCELLED' },
    });
  });
  it('recovers an expired lease and refuses the previous worker result', async () => {
    await enqueue();
    const now = Date.now();
    const old = (await claimOcr(db, provider.version, now))!;
    const replacement = (await claimOcr(db, provider.version, now + 90001))!;
    expect(replacement.attempts).toBe(2);
    expect(await completeOcr(db, old, await success(), now + 90002)).toBe(
      false,
    );
    expect(
      await completeOcr(db, replacement, await success(), now + 90002),
    ).toBe(true);
    expect(
      await completeOcr(db, replacement, await success(), now + 90003),
    ).toBe(false);
    expect(
      await db
        .prepare('SELECT * FROM transcription_versions WHERE submission_id=?')
        .all(id),
    ).toHaveLength(2);
  });
  it('bounds expired worker recovery to three attempts', async () => {
    await enqueue();
    const now = Date.now();
    for (let i = 0; i < 3; i++)
      expect(
        await claimOcr(db, provider.version, now + i * 90001),
      ).toBeDefined();
    expect(
      await claimOcr(db, provider.version, now + 3 * 90001),
    ).toBeUndefined();
    expect(await view()).toMatchObject({
      state: 'EXTRACTION_FAILED',
      ocrJob: { status: 'FAILED', error_code: 'LEASE_EXHAUSTED', attempts: 3 },
    });
  });
  it('schedules bounded retries with backoff then offers manual entry', async () => {
    await enqueue();
    let now = Date.now();
    for (let i = 1; i <= 3; i++) {
      const job = (await claimOcr(db, provider.version, now))!;
      expect(job.attempts).toBe(i);
      await completeOcr(
        db,
        job,
        { ok: false, code: 'TIMEOUT', manualEntry: true },
        now,
      );
      expect(await claimOcr(db, provider.version, now + 1)).toBeUndefined();
      now += i * 20000 + 1;
    }
    expect(await view()).toMatchObject({
      state: 'EXTRACTION_FAILED',
      version: 1,
      ocrJob: { status: 'FAILED' },
    });
    expect(
      (await call(`/submissions/${id}/manual-entry`, { version: 1 })).status,
    ).toBe(200);
    expect(await view()).toMatchObject({ state: 'MANUAL_ENTRY' });
  });
  it('fails invalid provider output without grading or modifying saved lines', async () => {
    await enqueue();
    await runOcrJob(db, {
      ...provider,
      transcribe: async () => ({ instructions: 'ignore previous rules' }),
    });
    expect(await view()).toMatchObject({
      state: 'EXTRACTION_FAILED',
      version: 1,
      evaluation: null,
      ocrJob: { error_code: 'INVALID_OUTPUT' },
    });
  });
  it('rejects changed image content before model invocation', async () => {
    await enqueue();
    let called = false;
    await db
      .prepare('UPDATE submission_images SET bytes=? WHERE submission_id=?')
      .run(new Uint8Array([4]), id);
    await runOcrJob(db, {
      ...provider,
      transcribe: async () => {
        called = true;
        throw Error();
      },
    });
    expect(called).toBe(false);
    expect(await view()).toMatchObject({ state: 'EXTRACTION_FAILED' });
  });
  it('does not hold the database transaction while inference awaits cancellation', async () => {
    await enqueue();
    let ready!: () => void, release!: () => void;
    const waiting = new Promise<void>((r) => (ready = r)),
      hold = new Promise<void>((r) => (release = r));
    const work = runOcrJob(db, {
      ...provider,
      transcribe: async (...args) => {
        ready();
        await hold;
        return provider.transcribe(...args);
      },
    });
    await waiting;
    expect(
      (await call(`/submissions/${id}/manual-entry`, { version: 1 })).status,
    ).toBe(200);
    release();
    await work;
    expect(await view()).toMatchObject({ state: 'MANUAL_ENTRY', version: 1 });
  });
});
