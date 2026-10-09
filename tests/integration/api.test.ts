import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { createApp } from '../../services/api/src/app.ts';
import { openDatabase, type DB } from '../../packages/database/src/local.ts';
import sharp from 'sharp';
import { Database } from '../../packages/database/src/adapter.ts';
import { testPostgres } from '../helpers/postgres.ts';
describe.each(['sqlite', 'postgres'] as const)('%s API', (engine) => {
  let db: DB | Database, app: ReturnType<typeof createApp>;
  let postgres: Awaited<ReturnType<typeof testPostgres>> | undefined;
  beforeAll(async () => {
    if (engine === 'postgres') postgres = await testPostgres();
  });
  afterAll(async () => {
    await postgres?.db.close();
  });
  beforeEach(async () => {
    if (postgres) await postgres.pg.exec('TRUNCATE users CASCADE');
    db = postgres?.db ?? openDatabase(':memory:');
    app = createApp(db);
  });
  afterEach(() => {
    if (!postgres) return db.close();
  });
  async function call(
    path: string,
    method = 'GET',
    body?: unknown,
    cookie = '',
  ) {
    return app.request(`http://localhost/api${path}`, {
      method,
      headers: {
        origin: 'http://localhost',
        'content-type': 'application/json',
        cookie,
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
  }
  async function demo() {
    const r = await call('/demo', 'POST');
    return {
      cookie: r.headers.get('set-cookie')!.split(';')[0]!,
      ...((await r.json()) as {
        assignment: string;
        room: string;
        student: string;
      }),
    };
  }
  async function teacher(cookie: string) {
    const r = await call('/demo/role', 'POST', { role: 'teacher' }, cookie);
    return r.headers.get('set-cookie')!.split(';')[0]!;
  }
  async function submission(cookie: string, assignment: string) {
    const r = await call(
      '/submissions',
      'POST',
      { assignmentId: assignment },
      cookie,
    );
    expect(r.status).toBe(201);
    return (
      (await r.json()) as {
        id: string;
      }
    ).id;
  }
  async function grade(cookie: string, id: string) {
    expect(
      (
        await call(
          `/submissions/${id}/transcription`,
          'PATCH',
          { version: 1, lines: ['3(x-2)=15', '3x-2=15', '3x=17', 'x=17/3'] },
          cookie,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await call(
          `/submissions/${id}/confirm`,
          'POST',
          { version: 2, confirmed: true },
          cookie,
        )
      ).status,
    ).toBe(200);
  }
  it('keeps generated reference and alternative paths teacher-only', async () => {
    const d = await demo();
    expect(
      (
        await call(
          '/questions?skillId=fraction-division&seed=0&difficulty=practice',
          'GET',
          undefined,
          d.cookie,
        )
      ).status,
    ).toBe(403);
    const tc = await teacher(d.cookie);
    const preview = await call(
      '/questions?skillId=fraction-division&seed=0&difficulty=practice',
      'GET',
      undefined,
      tc,
    );
    expect((await preview.json()).alternativePaths.length).toBeGreaterThan(0);
    const assignment = await call(
      '/assignments',
      'POST',
      {
        classroomId: d.room,
        skillId: 'fraction-division',
        seed: 0,
        difficulty: 'practice',
        title: 'Fraction division',
        feedback: 'immediate',
      },
      tc,
    );
    expect(assignment.status).toBe(201);
    const studentRole = await call(
      '/demo/role',
      'POST',
      { role: 'student' },
      tc,
    );
    const sc = studentRole.headers.get('set-cookie')!.split(';')[0]!;
    const listing = await (
      await call('/assignments', 'GET', undefined, sc)
    ).json();
    const question = listing.find(
      (a: { title: string }) => a.title === 'Fraction division',
    ).question;
    expect(question.reference).toBeUndefined();
    expect(question.alternativePaths).toBeUndefined();
    expect(question.figure.kind).toBe('fraction-bars');
  });
  it('persists a valid but unfinished simplification with a completion hint', async () => {
    const d = await demo(),
      tc = await teacher(d.cookie);
    const assignment = await (
      await call(
        '/assignments',
        'POST',
        {
          classroomId: d.room,
          skillId: 'fraction-equivalence',
          seed: 0,
          difficulty: 'practice',
          title: 'Simplify',
          feedback: 'immediate',
        },
        tc,
      )
    ).json();
    const listing = await (
      await call('/assignments', 'GET', undefined, tc)
    ).json();
    const question = listing.find(
      (a: { id: string }) => a.id === assignment.id,
    ).question;
    const studentRole = await call(
      '/demo/role',
      'POST',
      { role: 'student' },
      tc,
    );
    const sc = studentRole.headers.get('set-cookie')!.split(';')[0]!;
    const id = await submission(sc, assignment.id);
    await call(
      `/submissions/${id}/transcription`,
      'PATCH',
      { version: 1, lines: [question.expression] },
      sc,
    );
    expect(
      (
        await call(
          `/submissions/${id}/confirm`,
          'POST',
          { version: 2, confirmed: true },
          sc,
        )
      ).status,
    ).toBe(200);
    const result = await (
      await call(`/submissions/${id}`, 'GET', undefined, sc)
    ).json();
    expect(result.evaluation).toMatchObject({
      complete: false,
      firstError: null,
      completionHint: expect.stringContaining('lowest terms'),
    });
    expect(result.evaluation.engineVersion).toContain('completion-2');
  });
  it('grades collected expressions while keeping a restated expression incomplete', async () => {
    const d = await demo(),
      tc = await teacher(d.cookie);
    const q = await (
      await call(
        '/questions?skillId=combine-like-terms&seed=0&difficulty=intro',
        'GET',
        undefined,
        tc,
      )
    ).json();
    const ids = [];
    for (const title of ['Uncollected expression', 'Collected expression'])
      ids.push(
        (
          await (
            await call(
              '/assignments',
              'POST',
              {
                classroomId: d.room,
                skillId: 'combine-like-terms',
                seed: 0,
                difficulty: 'intro',
                title,
                feedback: 'immediate',
              },
              tc,
            )
          ).json()
        ).id,
      );
    const switched = await call('/demo/role', 'POST', { role: 'student' }, tc),
      sc = switched.headers.get('set-cookie')!.split(';')[0]!;
    for (const [index, assignmentId] of ids.entries()) {
      const id = await submission(sc, assignmentId);
      await call(
        `/submissions/${id}/transcription`,
        'PATCH',
        { version: 1, lines: index === 0 ? [q.expression] : q.reference },
        sc,
      );
      expect(
        (
          await call(
            `/submissions/${id}/confirm`,
            'POST',
            { version: 2, confirmed: true },
            sc,
          )
        ).status,
      ).toBe(200);
      const result = await (
        await call(`/submissions/${id}`, 'GET', undefined, sc)
      ).json();
      expect(result.evaluation).toMatchObject({
        firstError: null,
        requiresReview: false,
        complete: index === 1,
      });
      if (index === 0)
        expect(result.evaluation.completionHint).toContain(
          'combining like terms',
        );
    }
  });
  it('persists a complete manual workflow and teacher override without replacing automatic history', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment);
    await grade(d.cookie, id);
    let r = await (
      await call(`/submissions/${id}`, 'GET', undefined, d.cookie)
    ).json();
    expect(r.evaluation.firstError).toBe(2);
    const t = await teacher(d.cookie);
    expect(
      (
        await call(
          `/submissions/${id}/reviews`,
          'POST',
          {
            decision: 'needs_practice',
            reason: 'Practice distributing to both terms.',
          },
          t,
        )
      ).status,
    ).toBe(200);
    r = await (await call(`/submissions/${id}`, 'GET', undefined, t)).json();
    expect(r.state).toBe('FINALIZED');
    expect(r.reviews).toHaveLength(1);
    expect(r.evaluation.firstError).toBe(2);
    const events = await (
      await call(`/classrooms/${d.room}/events`, 'GET', undefined, t)
    ).json();
    expect(events.map((e: { type: string }) => e.type)).toContain(
      'FEEDBACK_RELEASED',
    );
    expect(
      (await db.prepare('SELECT COUNT(*) n FROM transcription_versions').get())
        ?.n,
    ).toBe(2);
  });
  it('requires authentication', async () =>
    expect((await call('/assignments')).status).toBe(401));
  it('rejects cross-origin mutation', async () =>
    expect(
      (
        await app.request('http://localhost/api/demo', {
          method: 'POST',
          headers: { origin: 'https://evil.example' },
        })
      ).status,
    ).toBe(403));
  it('rejects mutation without origin', async () =>
    expect(
      (await app.request('http://localhost/api/demo', { method: 'POST' }))
        .status,
    ).toBe(403));
  it('returns security cookie attributes', async () => {
    const r = await call('/demo', 'POST');
    expect(r.headers.get('set-cookie')).toContain('HttpOnly');
    expect(r.headers.get('set-cookie')).toContain('SameSite=Strict');
  });
  it('rejects cross-classroom reads and image reads', async () => {
    const a = await demo(),
      b = await demo(),
      id = await submission(a.cookie, a.assignment);
    for (const suffix of ['', '/image'])
      expect(
        (await call(`/submissions/${id}${suffix}`, 'GET', undefined, b.cookie))
          .status,
      ).toBe(404);
  });
  it('rejects cross-classroom writes', async () => {
    const a = await demo(),
      b = await demo(),
      id = await submission(a.cookie, a.assignment);
    expect(
      (
        await call(
          `/submissions/${id}/transcription`,
          'PATCH',
          { version: 1, lines: ['x=2'] },
          b.cookie,
        )
      ).status,
    ).toBe(404);
  });
  it('rejects unauthorized assignment access', async () => {
    const a = await demo(),
      b = await demo();
    expect(
      (
        await call(
          '/submissions',
          'POST',
          { assignmentId: a.assignment },
          b.cookie,
        )
      ).status,
    ).toBe(404);
  });
  it('requires teacher role to create classrooms', async () => {
    const d = await demo();
    expect(
      (await call('/classrooms', 'POST', { name: 'Room' }, d.cookie)).status,
    ).toBe(403);
  });
  it('does not leak classroom events', async () => {
    const a = await demo(),
      b = await demo(),
      t = await teacher(b.cookie);
    expect(
      (await call(`/classrooms/${a.room}/events`, 'GET', undefined, t)).status,
    ).toBe(404);
  });
  it('submission creation is idempotent', async () => {
    const d = await demo();
    expect(await submission(d.cookie, d.assignment)).toBe(
      await submission(d.cookie, d.assignment),
    );
  });
  it('rejects confirmation without explicit consent', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment);
    expect(
      (
        await call(
          `/submissions/${id}/confirm`,
          'POST',
          { version: 1, confirmed: false },
          d.cookie,
        )
      ).status,
    ).toBe(400);
    expect(
      (await db.prepare('SELECT COUNT(*) n FROM evaluations').get())?.n,
    ).toBe(0);
  });
  it('rejects grading an empty transcription', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment);
    expect(
      (
        await call(
          `/submissions/${id}/confirm`,
          'POST',
          { version: 1, confirmed: true },
          d.cookie,
        )
      ).status,
    ).toBe(400);
  });
  it('rejects stale edits', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment);
    await call(
      `/submissions/${id}/transcription`,
      'PATCH',
      { version: 1, lines: ['x=7'] },
      d.cookie,
    );
    expect(
      (
        await call(
          `/submissions/${id}/transcription`,
          'PATCH',
          { version: 1, lines: ['x=9'] },
          d.cookie,
        )
      ).status,
    ).toBe(409);
  });
  it('confirmation retries do not duplicate evaluations or events', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment);
    await grade(d.cookie, id);
    await call(
      `/submissions/${id}/confirm`,
      'POST',
      { version: 2, confirmed: true },
      d.cookie,
    );
    expect(
      (await db.prepare('SELECT COUNT(*) n FROM evaluations').get())?.n,
    ).toBe(1);
    expect(
      (
        await db
          .prepare(
            "SELECT COUNT(*) n FROM domain_events WHERE type='EVALUATION_COMPLETED'",
          )
          .get()
      )?.n,
    ).toBe(1);
  });
  it('locks confirmed transcription', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment);
    await grade(d.cookie, id);
    expect(
      (
        await call(
          `/submissions/${id}/transcription`,
          'PATCH',
          { version: 2, lines: ['x=7'] },
          d.cookie,
        )
      ).status,
    ).toBe(409);
  });
  it('enforces feedback release', async () => {
    const d = await demo();
    await db
      .prepare("UPDATE assignments SET feedback='teacher' WHERE id=?")
      .run(d.assignment);
    const id = await submission(d.cookie, d.assignment);
    await grade(d.cookie, id);
    const s = await (
      await call(`/submissions/${id}`, 'GET', undefined, d.cookie)
    ).json();
    expect(s.evaluation).toBeNull();
    expect(s.recommendation).toBeNull();
    expect(s.feedbackHeld).toBe(true);
  });
  it('rejects student grading overrides', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment);
    await grade(d.cookie, id);
    expect(
      (
        await call(
          `/submissions/${id}/reviews`,
          'POST',
          { decision: 'correct', reason: 'Change the result.' },
          d.cookie,
        )
      ).status,
    ).toBe(404);
  });
  it('saves a decoded image privately and reports OCR unavailable', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment),
      image = await sharp({
        create: { width: 20, height: 20, channels: 3, background: '#fff' },
      })
        .png()
        .toBuffer();
    const r = await app.request(
      `http://localhost/api/submissions/${id}/image`,
      {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          'content-type': 'image/png',
          cookie: d.cookie,
        },
        body: new Uint8Array(image),
      },
    );
    expect(r.status).toBe(200);
    expect(await r.json()).toMatchObject({
      ocr: 'unavailable',
      manualEntry: true,
    });
    const get = await call(
      `/submissions/${id}/image`,
      'GET',
      undefined,
      d.cookie,
    );
    expect(get.headers.get('content-type')).toBe('image/jpeg');
    expect(get.headers.get('cache-control')).toContain('no-store');
  });
  it('rejects fake image signatures and corrupt images', async () => {
    const d = await demo(),
      id = await submission(d.cookie, d.assignment);
    for (const bytes of [
      Buffer.from('<script>alert(1)</script>'),
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]),
    ])
      expect(
        (
          await app.request(`http://localhost/api/submissions/${id}/image`, {
            method: 'POST',
            headers: {
              origin: 'http://localhost',
              'content-type': 'image/png',
              cookie: d.cookie,
            },
            body: new Uint8Array(bytes),
          })
        ).status,
      ).toBe(400);
  });
  it('authenticates independent fictional accounts and joins a published assignment', async () => {
    const tr = await call('/auth/register', 'POST', {
        username: 'teacher_test',
        password: 'long-test-password',
        role: 'teacher',
      }),
      tc = tr.headers.get('set-cookie')!.split(';')[0]!;
    const room = await (
      await call('/classrooms', 'POST', { name: 'Algebra' }, tc)
    ).json();
    const ar = await call(
      '/assignments',
      'POST',
      {
        classroomId: room.id,
        title: 'Balance',
        skillId: 'one-step-equations',
        seed: 42,
        difficulty: 'intro',
        feedback: 'teacher',
      },
      tc,
    );
    expect(ar.status).toBe(201);
    const st = await call('/auth/register', 'POST', {
        username: 'student_test',
        password: 'long-test-password',
        role: 'student',
      }),
      sc = st.headers.get('set-cookie')!.split(';')[0]!;
    expect(
      (await call('/classrooms/enroll', 'POST', { code: room.code }, sc))
        .status,
    ).toBe(200);
    expect(
      await (await call('/assignments', 'GET', undefined, sc)).json(),
    ).toHaveLength(1);
    expect(
      (
        await call('/auth/login', 'POST', {
          username: 'student_test',
          password: 'wrong-password',
        })
      ).status,
    ).toBe(401);
    expect(
      (
        await call('/auth/login', 'POST', {
          username: 'student_test',
          password: 'long-test-password',
        })
      ).status,
    ).toBe(200);
  });
  it('invalidates a session on logout', async () => {
    const d = await demo();
    await call('/auth/logout', 'POST', undefined, d.cookie);
    expect((await call('/me', 'GET', undefined, d.cookie)).status).toBe(401);
  });
  it('does not expose reference solutions to students', async () => {
    const d = await demo();
    const a = await (
      await call('/assignments', 'GET', undefined, d.cookie)
    ).json();
    expect(a[0].question.reference).toBeUndefined();
  });
  it('rejects invalid pagination', async () => {
    const d = await demo(),
      t = await teacher(d.cookie);
    expect(
      (await call(`/classrooms/${d.room}/events?after=-1`, 'GET', undefined, t))
        .status,
    ).toBe(400);
  });
});
