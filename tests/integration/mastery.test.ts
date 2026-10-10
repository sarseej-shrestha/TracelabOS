import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { openDatabase } from '../../packages/database/src/local.ts';
import {
  asDatabase,
  Database,
  type Value,
} from '../../packages/database/src/adapter.ts';
import { createApp } from '../../services/api/src/app.ts';
import { testPostgres } from '../helpers/postgres.ts';
import { estimateMastery } from '../../packages/learning-engine/src/mastery.ts';
import { skills } from '../../packages/question-bank/src/index.ts';

describe.each(['sqlite', 'postgres'] as const)(
  '%s reviewed mastery',
  (engine) => {
    let db: Database, app: ReturnType<typeof createApp>;
    beforeAll(async () => {
      db =
        engine === 'sqlite'
          ? asDatabase(openDatabase(':memory:'))
          : (await testPostgres()).db;
    });
    afterAll(() => db.close());
    beforeEach(() => {
      app = createApp(db);
    });
    const call = (
      path: string,
      cookie = '',
      body?: unknown,
      method = body === undefined ? 'GET' : 'POST',
    ) =>
      app.request(`http://localhost/api${path}`, {
        method,
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
          cookie,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    const session = (r: Response) =>
      r.headers.get('set-cookie')!.split(';')[0]!;
    async function setup() {
      const response = await call('/demo', '', {}),
        d = await response.json();
      const cookie = session(response);
      const submission = await call('/submissions', cookie, {
        assignmentId: d.assignment,
      });
      const { id } = await submission.json();
      return { ...d, id, cookie } as {
        id: string;
        room: string;
        student: string;
        assignment: string;
        cookie: string;
      };
    }
    async function grade(d: Awaited<ReturnType<typeof setup>>, line = 'x=7') {
      expect(
        (
          await call(
            `/submissions/${d.id}/transcription`,
            d.cookie,
            { version: 1, lines: [line] },
            'PATCH',
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await call(`/submissions/${d.id}/confirm`, d.cookie, {
            version: 2,
            confirmed: true,
          })
        ).status,
      ).toBe(200);
      return session(await call('/demo/role', d.cookie, { role: 'teacher' }));
    }
    const review = (id: string, cookie: string, decision = 'correct') =>
      call(`/submissions/${id}/reviews`, cookie, {
        decision,
        reason: 'Reviewed original work and confirmed the decision.',
      });
    const progress = async (
      d: Awaited<ReturnType<typeof setup>>,
      cookie: string,
    ) => {
      const response = await call(
        `/classrooms/${d.room}/mastery?studentId=${d.student}`,
        cookie,
      );
      expect(response.status).toBe(200);
      return response.json();
    };
    it('seeds exactly the active curriculum and prerequisite edges', async () => {
      expect(
        await db.prepare('SELECT id,title FROM skills ORDER BY id').all(),
      ).toEqual(
        skills
          .map(({ id, title }) => ({ id, title }))
          .sort((a, b) => a.id.localeCompare(b.id)),
      );
      expect(
        await db
          .prepare(
            'SELECT skill_id,prerequisite_id FROM skill_prerequisites ORDER BY skill_id,prerequisite_id',
          )
          .all(),
      ).toEqual(
        skills
          .flatMap((s) =>
            s.prerequisites.map((p) => ({
              skill_id: s.id,
              prerequisite_id: p,
            })),
          )
          .sort(
            (a, b) =>
              a.skill_id.localeCompare(b.skill_id) ||
              a.prerequisite_id.localeCompare(b.prerequisite_id),
          ),
      );
    });
    it('records no evidence from drafts, automatic evaluation, or a pending teacher review', async () => {
      const d = await setup();
      expect((await progress(d, d.cookie)).skills).toEqual([]);
      const tc = await grade(d, 'x*x=49');
      expect((await progress(d, tc)).skills).toEqual([]);
      expect((await review(d.id, tc, 'requires_review')).status).toBe(200);
      const result = (await progress(d, tc)).skills[0];
      expect(result).toMatchObject({
        evidenceCount: 0,
        correctCount: 0,
        probability: 0.2,
        status: 'insufficient_evidence',
      });
      expect(
        (
          await db
            .prepare(
              'SELECT outcome FROM mastery_evidence WHERE submission_id=?',
            )
            .get(d.id)
        )?.outcome,
      ).toBeNull();
    });
    it('deduplicates concurrent reviews and replaces or retracts evidence without changing the original evaluation', async () => {
      const d = await setup(),
        tc = await grade(d);
      const evaluation = await db
        .prepare('SELECT * FROM evaluations WHERE submission_id=?')
        .get(d.id);
      const responses = await Promise.all(
        Array.from({ length: 6 }, () => review(d.id, tc)),
      );
      expect(responses.map((r) => r.status)).toEqual(Array(6).fill(200));
      expect((await progress(d, tc)).skills[0]).toMatchObject({
        evidenceCount: 1,
        correctCount: 1,
        probability: estimateMastery([true]).probability,
      });
      expect(
        (
          await db
            .prepare(
              'SELECT COUNT(*) n FROM mastery_evidence WHERE submission_id=?',
            )
            .get(d.id)
        )?.n,
      ).toBe(1);
      await review(d.id, tc, 'needs_practice');
      expect((await progress(d, tc)).skills[0]).toMatchObject({
        evidenceCount: 1,
        correctCount: 0,
        probability: estimateMastery([false]).probability,
      });
      await review(d.id, tc, 'requires_review');
      expect((await progress(d, tc)).skills[0]).toMatchObject({
        evidenceCount: 0,
        probability: 0.2,
      });
      await review(d.id, tc);
      expect((await progress(d, tc)).skills[0].evidenceCount).toBe(1);
      expect(
        await db
          .prepare('SELECT * FROM evaluations WHERE submission_id=?')
          .get(d.id),
      ).toEqual(evaluation);
      expect(
        (
          await db
            .prepare(
              'SELECT COUNT(*) n FROM teacher_reviews WHERE submission_id=?',
            )
            .get(d.id)
        )?.n,
      ).toBe(9);
      const latest = await db
        .prepare(
          'SELECT id FROM teacher_reviews WHERE submission_id=? ORDER BY rowid DESC LIMIT 1',
        )
        .get(d.id);
      expect(
        (
          await db
            .prepare(
              'SELECT review_id FROM mastery_evidence WHERE submission_id=?',
            )
            .get(d.id)
        )?.review_id,
      ).toBe(latest?.id);
      const student = session(
        await call('/demo/role', tc, { role: 'student' }),
      );
      expect((await progress(d, student)).skills[0].evidenceCount).toBe(1);
    });
    it('replays observations in attempt order when an older review changes', async () => {
      const d = await setup();
      let tc = await grade(d);
      await review(d.id, tc);
      const assignment = await (
        await call('/assignments', tc, {
          classroomId: d.room,
          skillId: 'distributive-property',
          seed: 0,
          difficulty: 'practice',
          title: 'Second observation',
          feedback: 'immediate',
        })
      ).json();
      const sc = session(await call('/demo/role', tc, { role: 'student' }));
      const { id } = await (
        await call('/submissions', sc, { assignmentId: assignment.id })
      ).json();
      tc = await grade({ ...d, id, cookie: sc });
      // Explicit ordering makes the assertion independent of clock resolution.
      await db
        .prepare(
          'UPDATE mastery_evidence SET observed_at=? WHERE submission_id=?',
        )
        .run('2020-01-01T00:00:00.000Z', d.id);
      await review(id, tc, 'needs_practice');
      expect((await progress(d, tc)).skills[0].probability).toBeCloseTo(
        estimateMastery([true, false]).probability,
        14,
      );
      await review(d.id, tc, 'needs_practice');
      expect((await progress(d, tc)).skills[0]).toMatchObject({
        evidenceCount: 2,
        correctCount: 0,
      });
      expect((await progress(d, tc)).skills[0].probability).toBeCloseTo(
        estimateMastery([false, false]).probability,
        14,
      );
      await review(d.id, tc, 'requires_review');
      expect((await progress(d, tc)).skills[0].probability).toBeCloseTo(
        estimateMastery([false]).probability,
        14,
      );
    });
    it('isolates classroom scopes and denies peer, foreign-teacher and anonymous access', async () => {
      const d = await setup(),
        tc = await grade(d);
      await review(d.id, tc);
      const foreign = await setup();
      expect(
        (
          await call(
            `/classrooms/${d.room}/mastery?studentId=${d.student}`,
            foreign.cookie,
          )
        ).status,
      ).toBe(404);
      const ft = await grade(foreign);
      expect(
        (await call(`/classrooms/${d.room}/mastery?studentId=${d.student}`, ft))
          .status,
      ).toBe(404);
      expect((await call(`/classrooms/${d.room}/mastery`)).status).toBe(401);
      expect(
        (
          await call(
            `/classrooms/${d.room}/mastery?studentId=${foreign.student}`,
            tc,
          )
        ).status,
      ).toBe(404);
      const room = await (
        await call('/classrooms', tc, { name: 'Separate evidence' })
      ).json();
      await db
        .prepare('INSERT INTO classroom_memberships VALUES(?,?)')
        .run(room.id, d.student);
      expect(
        (
          await call(
            `/classrooms/${room.id}/mastery?studentId=${d.student}`,
            tc,
          )
        ).status,
      ).toBe(200);
      expect(
        (
          await (
            await call(
              `/classrooms/${room.id}/mastery?studentId=${d.student}`,
              tc,
            )
          ).json()
        ).skills,
      ).toEqual([]);
      // Even an enrolled peer cannot supply another student's ID.
      await db
        .prepare('INSERT INTO classroom_memberships VALUES(?,?)')
        .run(d.room, foreign.student);
      const fc = session(await call('/demo/role', ft, { role: 'student' }));
      expect(
        (await call(`/classrooms/${d.room}/mastery?studentId=${d.student}`, fc))
          .status,
      ).toBe(404);
    });
    it('rolls back review, evidence, estimate and state when release persistence fails', async () => {
      const d = await setup(),
        tc = await grade(d);
      const query = async (sql: string, values: Value[]) => {
        if (
          sql.includes('INSERT INTO domain_events') &&
          values.includes('FEEDBACK_RELEASED')
        )
          throw new Error('injected release outage');
        return db.prepare(sql).all(...values);
      };
      app = createApp(
        new Database({
          kind: engine,
          query,
          transaction: (fn, write) =>
            db.transaction(() => fn({ query }), write),
          close: async () => {},
        }),
      );
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        expect((await review(d.id, tc)).status).toBe(500);
      } finally {
        log.mockRestore();
      }
      for (const table of ['mastery_evidence', 'teacher_reviews'])
        expect(
          (
            await db
              .prepare(`SELECT COUNT(*) n FROM ${table} WHERE submission_id=?`)
              .get(d.id)
          )?.n,
        ).toBe(0);
      expect((await progress(d, tc)).skills).toEqual([]);
      expect(
        (await db.prepare('SELECT state FROM submissions WHERE id=?').get(d.id))
          ?.state,
      ).toBe('EVALUATED');
    });
  },
);
