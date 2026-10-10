import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  describe,
  expect,
  it,
} from 'vitest';
import { openDatabase } from '../../packages/database/src/local.ts';
import {
  asDatabase,
  Database,
  type Value,
} from '../../packages/database/src/adapter.ts';
import { testPostgres } from '../helpers/postgres.ts';
import { rebuildMastery } from '../../services/api/src/mastery-rebuild.ts';
import { estimateMastery } from '../../packages/learning-engine/src/mastery.ts';
import { generateQuestion } from '../../packages/question-bank/src/index.ts';

describe.each(['sqlite', 'postgres'] as const)(
  '%s historical mastery',
  (engine) => {
    let db: Database,
      postgres: Awaited<ReturnType<typeof testPostgres>> | undefined;
    beforeAll(async () => {
      if (engine === 'postgres') postgres = await testPostgres();
    });
    afterAll(async () => {
      await postgres?.db.close();
    });
    beforeEach(async () => {
      if (postgres) await postgres.pg.exec('TRUNCATE users CASCADE');
      db = postgres?.db ?? asDatabase(openDatabase(':memory:'));
      await db
        .prepare('INSERT INTO users VALUES(?,?,?,?,?,?)')
        .run('t', 'teacher', null, 'teacher', null, '2026-01-01');
      await db
        .prepare('INSERT INTO users VALUES(?,?,?,?,?,?)')
        .run('s', 'student', null, 'student', null, '2026-01-01');
      await db
        .prepare('INSERT INTO classrooms VALUES(?,?,?,?,?)')
        .run('c', 't', 'Historical classroom', 'AABBCCDDEEFF', '2026-01-01');
      await db
        .prepare('INSERT INTO classroom_memberships VALUES(?,?)')
        .run('c', 's');
      for (let i = 1; i <= 3; i++) {
        const stamp = `2026-01-0${i}T00:00:00.000Z`;
        await db
          .prepare('INSERT INTO assignments VALUES(?,?,?,?,?,?,?)')
          .run(
            `a${i}`,
            'c',
            `Historic assignment ${i}`,
            JSON.stringify(
              generateQuestion('fraction-equivalence', i, 'intro'),
            ),
            'teacher',
            null,
            stamp,
          );
        await db
          .prepare('INSERT INTO submissions VALUES(?,?,?,?,?,?)')
          .run(`s${i}`, `a${i}`, 's', 'FINALIZED', 1, stamp);
        await db
          .prepare('INSERT INTO transcription_versions VALUES(?,?,?,?,?)')
          .run(`s${i}`, 1, '["1/2"]', 'student', stamp);
        await db
          .prepare('INSERT INTO evaluations VALUES(?,?,?,?,?,?)')
          .run(
            `e${i}`,
            `s${i}`,
            1,
            'historic-math',
            '{"retained":true}',
            stamp,
          );
        await db
          .prepare(
            'INSERT INTO teacher_reviews(id,submission_id,teacher_id,decision,reason,created_at) VALUES(?,?,?,?,?,?)',
          )
          .run(
            `r${i}`,
            `s${i}`,
            't',
            i === 2 ? 'needs_practice' : 'correct',
            'Historical teacher decision',
            stamp,
          );
      }
    });
    afterEach(async () => {
      if (!postgres) await db.close();
    });
    const projections = async () => ({
      evidence: await db
        .prepare('SELECT * FROM mastery_evidence ORDER BY submission_id')
        .all(),
      estimates: await db
        .prepare('SELECT * FROM mastery_estimates ORDER BY algorithm_version')
        .all(),
    });
    const history = async () => {
      const result: Record<string, unknown> = {};
      for (const table of [
        'users',
        'classrooms',
        'classroom_memberships',
        'assignments',
        'submissions',
        'transcription_versions',
        'evaluations',
        'teacher_reviews',
        'recommendations',
        'domain_events',
      ])
        result[table] = await db
          .prepare(`SELECT * FROM ${table} ORDER BY 1`)
          .all();
      return result;
    };
    it('plans without writes, applies ordered evidence, preserves history/old models and repeats as a no-op', async () => {
      // Latest review retracts the third attempt; a later evaluation must not be attributed to this review.
      await db
        .prepare(
          'INSERT INTO teacher_reviews(id,submission_id,teacher_id,decision,reason,created_at) VALUES(?,?,?,?,?,?)',
        )
        .run(
          'r4',
          's3',
          't',
          'requires_review',
          'Uncertain original work',
          '2026-01-04T00:00:00.000Z',
        );
      await db
        .prepare('INSERT INTO evaluations VALUES(?,?,?,?,?,?)')
        .run(
          'future-evaluation',
          's1',
          1,
          'future-math',
          '{"retained":true}',
          '2026-02-01T00:00:00.000Z',
        );
      await db
        .prepare('INSERT INTO mastery_estimates VALUES(?,?,?,?,?,?,?,?)')
        .run(
          'c',
          's',
          'fraction-equivalence',
          'older-model',
          0.3,
          10,
          3,
          '2025-01-01',
        );
      await db
        .prepare('INSERT INTO recommendations VALUES(?,?,?,?,?,?,?,?,?,?,?,?)')
        .run(
          'rec',
          's1',
          'a3',
          's',
          'r1',
          'e1',
          'fraction-equivalence',
          'historical-rules',
          'Historical intervention',
          '{"immutable":true}',
          't',
          '2026-01-01',
        );
      const before = await history(),
        empty = await projections();
      const plan = await rebuildMastery(db);
      expect(plan).toMatchObject({
        mode: 'dry-run',
        applied: false,
        evidenceItems: 3,
        estimateScopes: 1,
        blocked: {},
        changes: { evidence: { inserted: 3 }, estimates: { inserted: 1 } },
      });
      expect(await projections()).toEqual(empty);
      expect(JSON.stringify(plan)).not.toContain('Historical classroom');
      expect((await rebuildMastery(db, true)).applied).toBe(true);
      const result = await projections();
      expect(result.evidence[0]).toMatchObject({
        evaluation_id: 'e1',
        outcome: 1,
      });
      expect(result.evidence[2]).toMatchObject({
        review_id: 'r4',
        outcome: null,
      });
      const estimate = result.estimates.find(
        (row) => row.algorithm_version === 'bkt-reviewed-1',
      );
      expect(estimate).toMatchObject({
        evidence_count: 2,
        correct_count: 1,
        probability: estimateMastery([true, false]).probability,
      });
      expect(
        result.estimates.find((row) => row.algorithm_version === 'older-model'),
      ).toEqual(empty.estimates[0]);
      expect(await history()).toEqual(before);
      expect(await rebuildMastery(db, true)).toMatchObject({
        applied: false,
        changes: {
          evidence: { inserted: 0, updated: 0, removed: 0 },
          estimates: { inserted: 0, updated: 0, removed: 0 },
        },
      });
      expect(await projections()).toEqual(result);
    });
    it('repairs corrupted current projections and replays a corrected older review in its original position', async () => {
      await rebuildMastery(db, true);
      await db
        .prepare(
          'UPDATE mastery_estimates SET probability=.5,evidence_count=99,correct_count=99 WHERE algorithm_version=?',
        )
        .run('bkt-reviewed-1');
      await db
        .prepare(
          'INSERT INTO teacher_reviews(id,submission_id,teacher_id,decision,reason,created_at) VALUES(?,?,?,?,?,?)',
        )
        .run(
          'correction',
          's1',
          't',
          'needs_practice',
          'Correction to oldest work',
          '2026-03-01T00:00:00.000Z',
        );
      const plan = await rebuildMastery(db);
      expect(plan.changes.evidence.updated).toBe(1);
      expect(plan.changes.estimates.updated).toBe(1);
      await rebuildMastery(db, true);
      expect((await projections()).estimates[0]).toMatchObject({
        evidence_count: 3,
        correct_count: 1,
        probability: estimateMastery([false, false, true]).probability,
      });
    });
    it.each([
      'unknown-skill',
      'bad-json',
      'missing-evaluation',
      'bad-decision',
      'bad-timestamp',
    ])('blocks %s without changing any projection', async (problem) => {
      await rebuildMastery(db, true);
      if (problem === 'unknown-skill')
        await db
          .prepare('UPDATE assignments SET question=? WHERE id=?')
          .run('{"skillId":"unknown"}', 'a1');
      if (problem === 'bad-json')
        await db
          .prepare('UPDATE assignments SET question=? WHERE id=?')
          .run('{invalid', 'a1');
      if (problem === 'missing-evaluation')
        await db
          .prepare('UPDATE evaluations SET created_at=? WHERE id=?')
          .run('2099-01-01', 'e1');
      if (problem === 'bad-decision')
        await db
          .prepare('UPDATE teacher_reviews SET decision=? WHERE id=?')
          .run('invalid', 'r1');
      if (problem === 'bad-timestamp')
        await db
          .prepare('UPDATE teacher_reviews SET created_at=? WHERE id=?')
          .run('not-a-date', 'r1');
      const before = await projections();
      expect(Object.values((await rebuildMastery(db)).blocked)).toEqual([1]);
      await expect(rebuildMastery(db, true)).rejects.toThrow(
        'REBUILD_BLOCKED_INVALID_EVIDENCE',
      );
      expect(await projections()).toEqual(before);
    });
    it('rolls back replacement if an estimate insert fails after evidence writes', async () => {
      await rebuildMastery(db, true);
      await db.prepare('UPDATE mastery_estimates SET probability=.4').run();
      const before = await projections();
      const query = async (sql: string, values: Value[]) => {
        if (sql.startsWith('INSERT INTO mastery_estimates'))
          throw new Error('injected rebuild outage');
        return db.prepare(sql).all(...values);
      };
      const failing = new Database({
        kind: engine,
        query,
        transaction: (fn, write) => db.transaction(() => fn({ query }), write),
        close: async () => {},
      });
      await expect(rebuildMastery(failing, true)).rejects.toThrow(
        'injected rebuild outage',
      );
      expect(await projections()).toEqual(before);
    });
    it('excludes unfinalized attempts and removes their obsolete derived evidence only', async () => {
      await rebuildMastery(db, true);
      await db
        .prepare("UPDATE submissions SET state='TEACHER_REVIEW' WHERE id='s1'")
        .run();
      const before = await history();
      expect((await rebuildMastery(db)).changes.evidence.removed).toBe(1);
      await rebuildMastery(db, true);
      expect((await projections()).evidence).toHaveLength(2);
      expect(await history()).toEqual(before);
    });
  },
);
