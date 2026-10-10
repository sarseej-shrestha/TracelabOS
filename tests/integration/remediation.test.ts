import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../../packages/database/src/local.ts';
import {
  asDatabase,
  Database,
  type Value,
} from '../../packages/database/src/adapter.ts';
import { createApp } from '../../services/api/src/app.ts';
import { testPostgres } from '../helpers/postgres.ts';
describe.each(['sqlite', 'postgres'] as const)(
  '%s targeted remediation',
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
    async function setup(line = '3x-2=15') {
      const r = await call('/demo', '', {}),
        d = await r.json(),
        sc = session(r);
      const { id } = await (
        await call('/submissions', sc, { assignmentId: d.assignment })
      ).json();
      await call(
        `/submissions/${id}/transcription`,
        sc,
        { version: 1, lines: [line] },
        'PATCH',
      );
      await call(`/submissions/${id}/confirm`, sc, {
        version: 2,
        confirmed: true,
      });
      const tc = session(await call('/demo/role', sc, { role: 'teacher' }));
      return { ...d, id, tc } as {
        id: string;
        tc: string;
        room: string;
        student: string;
      };
    }
    async function review(
      d: Awaited<ReturnType<typeof setup>>,
      decision = 'needs_practice',
    ) {
      expect(
        (
          await call(`/submissions/${d.id}/reviews`, d.tc, {
            decision,
            reason: 'Inspected the original work; assign targeted practice.',
          })
        ).status,
      ).toBe(200);
      return (await (await call(`/submissions/${d.id}`, d.tc)).json())
        .remediation.reviewId as string;
    }
    const assign = (d: Awaited<ReturnType<typeof setup>>, reviewId: string) =>
      call(`/submissions/${d.id}/remediation`, d.tc, { reviewId });
    it('publishes one immutable follow-up despite concurrent retries and completes it through the real workflow', async () => {
      const d = await setup(),
        reviewId = await review(d);
      const responses = await Promise.all(
        Array.from({ length: 6 }, () => assign(d, reviewId)),
      );
      expect(responses.map((r) => r.status).sort()).toEqual([
        200, 200, 200, 200, 200, 201,
      ]);
      const results = await Promise.all(responses.map((r) => r.json()));
      expect(new Set(results.map((r) => r.id)).size).toBe(1);
      const id = results[0].id;
      const record = await db
        .prepare('SELECT * FROM recommendations WHERE source_submission_id=?')
        .get(d.id);
      expect(record).toMatchObject({
        assignment_id: id,
        student_id: d.student,
        review_id: reviewId,
        skill_id: 'arithmetic-expressions',
        algorithm_version: 'rules-0.2.0',
      });
      expect(JSON.parse(record!.mastery_snapshot as string)).toMatchObject({
        algorithmVersion: 'bkt-reviewed-1',
        parameters: { prior: 0.2 },
        skills: [{ evidenceCount: 1 }],
      });
      expect(
        (
          await db
            .prepare(
              "SELECT COUNT(*) n FROM domain_events WHERE submission_id=? AND type='REMEDIATION_ASSIGNED'",
            )
            .get(d.id)
        )?.n,
      ).toBe(1);
      const teacherAssignments = await (
        await call('/assignments', d.tc)
      ).json();
      const question = teacherAssignments.find(
        (a: { id: string }) => a.id === id,
      ).question;
      const sc = session(await call('/demo/role', d.tc, { role: 'student' }));
      const studentAssignments = await (await call('/assignments', sc)).json();
      const visible = studentAssignments.find(
        (a: { id: string }) => a.id === id,
      );
      expect(visible.practice_reason).toContain('teacher requested');
      expect(visible.question.reference).toBeUndefined();
      expect(visible.question.parameters).toBeUndefined();
      const submission = await call('/submissions', sc, { assignmentId: id });
      expect(submission.status).toBe(201);
      const childId = (await submission.json()).id;
      await call(
        `/submissions/${childId}/transcription`,
        sc,
        { version: 1, lines: question.reference },
        'PATCH',
      );
      await call(`/submissions/${childId}/confirm`, sc, {
        version: 2,
        confirmed: true,
      });
      const child = await (await call(`/submissions/${childId}`, sc)).json();
      expect(child.evaluation).toMatchObject({
        firstError: null,
        complete: true,
        requiresReview: false,
      });
      d.tc = session(await call('/demo/role', sc, { role: 'teacher' }));
      await review({ ...d, id: childId }, 'correct');
      const mastery = await (
        await call(`/classrooms/${d.room}/mastery?studentId=${d.student}`, d.tc)
      ).json();
      expect(
        mastery.skills.find(
          (s: { skillId: string }) => s.skillId === 'arithmetic-expressions',
        ),
      ).toMatchObject({ evidenceCount: 1, correctCount: 1 });
      // Correcting the source review never rewrites an already published intervention.
      await review(d, 'correct');
      expect((await assign(d, reviewId)).status).toBe(200);
      expect(
        await db
          .prepare('SELECT * FROM recommendations WHERE source_submission_id=?')
          .get(d.id),
      ).toEqual(record);
    });
    it('rejects stale, correct and pending reviews before publishing any assignment', async () => {
      const d = await setup();
      expect((await assign(d, randomUUID())).status).toBe(409);
      const first = await review(d);
      const latest = await review(d);
      expect((await assign(d, first)).status).toBe(409);
      expect((await (await assign(d, first)).json()).error).toBe(
        'STALE_REVIEW',
      );
      await review(d, 'correct');
      expect((await assign(d, latest)).status).toBe(409);
      await review(d, 'requires_review');
      expect((await assign(d, latest)).status).toBe(409);
      expect(
        await db
          .prepare(
            'SELECT id FROM recommendations WHERE source_submission_id=?',
          )
          .get(d.id),
      ).toBeUndefined();
      expect(
        (
          await db
            .prepare('SELECT COUNT(*) n FROM assignments WHERE classroom_id=?')
            .get(d.room)
        )?.n,
      ).toBe(1);
    });
    it('permits explicit teacher-directed practice after unsupported automatic work without reusing unproved error labels', async () => {
      const d = await setup('x*x=49'),
        id = await review(d);
      expect((await assign(d, id)).status).toBe(201);
      const record = await db
        .prepare(
          'SELECT reason,skill_id FROM recommendations WHERE source_submission_id=?',
        )
        .get(d.id);
      expect(record?.skill_id).toBe('arithmetic-expressions');
      expect(record?.reason).toContain('teacher requested');
      expect(record?.reason).not.toContain('Review the transcription');
    });
    it('denies peers and outsiders both enumeration and direct submission access', async () => {
      const d = await setup(),
        reviewId = await review(d);
      const peer = await setup();
      await db
        .prepare('INSERT INTO classroom_memberships VALUES(?,?)')
        .run(d.room, peer.student);
      const id = (await (await assign(d, reviewId)).json()).id;
      expect(
        (await call(`/submissions/${d.id}/remediation`, peer.tc, { reviewId }))
          .status,
      ).toBe(404);
      expect(
        (await call(`/submissions/${d.id}/remediation`, '', { reviewId }))
          .status,
      ).toBe(401);
      const pc = session(
        await call('/demo/role', peer.tc, { role: 'student' }),
      );
      expect(
        (await (await call('/assignments', pc)).json()).some(
          (a: { id: string }) => a.id === id,
        ),
      ).toBe(false);
      expect(
        (await call('/submissions', pc, { assignmentId: id })).status,
      ).toBe(404);
      expect(
        (await call(`/submissions/${d.id}/remediation`, pc, { reviewId }))
          .status,
      ).toBe(404);
      const sc = session(await call('/demo/role', d.tc, { role: 'student' }));
      expect(
        (await call(`/submissions/${d.id}/remediation`, sc, { reviewId }))
          .status,
      ).toBe(404);
      expect(
        (await call('/submissions', sc, { assignmentId: id })).status,
      ).toBe(201);
    });
    it('advances past a prerequisite only when the current classroom has sufficient current-version evidence', async () => {
      const d = await setup(),
        reviewId = await review(d);
      await db
        .prepare('INSERT INTO mastery_estimates VALUES(?,?,?,?,?,?,?,?)')
        .run(
          d.room,
          d.student,
          'arithmetic-expressions',
          'bkt-reviewed-1',
          0.99,
          3,
          3,
          new Date().toISOString(),
        );
      // A historical model version must not mark the next prerequisite ready.
      await db
        .prepare('INSERT INTO mastery_estimates VALUES(?,?,?,?,?,?,?,?)')
        .run(
          d.room,
          d.student,
          'combine-like-terms',
          'historical-model',
          0.99,
          3,
          3,
          new Date().toISOString(),
        );
      expect((await assign(d, reviewId)).status).toBe(201);
      const record = await db
        .prepare(
          'SELECT skill_id,mastery_snapshot FROM recommendations WHERE source_submission_id=?',
        )
        .get(d.id);
      expect(record?.skill_id).toBe('combine-like-terms');
      const snapshot = JSON.parse(record!.mastery_snapshot as string);
      expect(
        snapshot.skills.some(
          (skill: { skillId: string }) =>
            skill.skillId === 'combine-like-terms',
        ),
      ).toBe(false);
      expect(
        snapshot.skills.find(
          (skill: { skillId: string }) =>
            skill.skillId === 'arithmetic-expressions',
        ),
      ).toMatchObject({ evidenceCount: 3, probability: 0.99 });
    });
    it('does not target a student who is no longer enrolled', async () => {
      const d = await setup(),
        id = await review(d);
      await db
        .prepare(
          'DELETE FROM classroom_memberships WHERE classroom_id=? AND user_id=?',
        )
        .run(d.room, d.student);
      const response = await assign(d, id);
      expect(response.status).toBe(409);
      expect((await response.json()).error).toBe('STUDENT_NOT_ENROLLED');
    });
    it('rolls back assignment, provenance and publication when event persistence fails', async () => {
      const d = await setup(),
        id = await review(d);
      const query = async (sql: string, values: Value[]) => {
        if (
          sql.includes('INSERT INTO domain_events') &&
          values.includes('REMEDIATION_ASSIGNED')
        )
          throw new Error('injected publication failure');
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
        expect((await assign(d, id)).status).toBe(500);
      } finally {
        log.mockRestore();
      }
      expect(
        await db
          .prepare(
            'SELECT id FROM recommendations WHERE source_submission_id=?',
          )
          .get(d.id),
      ).toBeUndefined();
      expect(
        (
          await db
            .prepare('SELECT COUNT(*) n FROM assignments WHERE classroom_id=?')
            .get(d.room)
        )?.n,
      ).toBe(1);
      expect(
        (
          await db
            .prepare(
              "SELECT COUNT(*) n FROM domain_events WHERE classroom_id=? AND type='ASSIGNMENT_PUBLISHED'",
            )
            .get(d.room)
        )?.n,
      ).toBe(1);
    });
  },
);
