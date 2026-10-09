import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { readFile } from 'node:fs/promises';
import { openDatabase } from '../../packages/database/src/local.ts';
import {
  asDatabase,
  Database,
  postgresParameters,
  type Value,
} from '../../packages/database/src/adapter.ts';
import { applyMigration } from '../../packages/database/src/migrations.ts';
import { createApp } from '../../services/api/src/app.ts';
import { testPostgres } from '../helpers/postgres.ts';

describe.each(['sqlite', 'postgres'] as const)(
  '%s async transactions',
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
    const call = (path: string, body: unknown, cookie = '', method = 'POST') =>
      app.request(`http://localhost/api${path}`, {
        method,
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
          cookie,
        },
        body: JSON.stringify(body),
      });
    async function setup() {
      const r = await call('/demo', {});
      const d = await r.json();
      const cookie = r.headers.get('set-cookie')!.split(';')[0]!;
      const s = await call(
        '/submissions',
        { assignmentId: d.assignment },
        cookie,
      );
      return { ...d, cookie, id: (await s.json()).id as string };
    }
    it('serializes simultaneous creates into one submission and one receipt event', async () => {
      const d = await setup();
      const replies = await Promise.all(
        Array.from({ length: 8 }, () =>
          call('/submissions', { assignmentId: d.assignment }, d.cookie),
        ),
      );
      expect(replies.map((r) => r.status)).toEqual(Array(8).fill(201));
      for (const reply of replies) expect((await reply.json()).id).toBe(d.id);
      expect(
        (
          await db
            .prepare(
              "SELECT CAST(COUNT(*) AS INTEGER) n FROM domain_events WHERE submission_id=? AND type='SUBMISSION_RECEIVED'",
            )
            .get(d.id)
        )?.n,
      ).toBe(1);
    });
    it('allows exactly one competing transcription edit', async () => {
      const d = await setup();
      const replies = await Promise.all(
        ['x=7', 'x=8'].map((line) =>
          call(
            `/submissions/${d.id}/transcription`,
            { version: 1, lines: [line] },
            d.cookie,
            'PATCH',
          ),
        ),
      );
      expect(replies.map((r) => r.status).sort()).toEqual([200, 409]);
      expect(
        (
          await db
            .prepare('SELECT version FROM submissions WHERE id=?')
            .get(d.id)
        )?.version,
      ).toBe(2);
    });
    it('grades concurrent confirmation retries exactly once', async () => {
      const d = await setup();
      await call(
        `/submissions/${d.id}/transcription`,
        { version: 1, lines: ['x=7'] },
        d.cookie,
        'PATCH',
      );
      const replies = await Promise.all(
        Array.from({ length: 6 }, () =>
          call(
            `/submissions/${d.id}/confirm`,
            { version: 2, confirmed: true },
            d.cookie,
          ),
        ),
      );
      expect(replies.map((r) => r.status)).toEqual(Array(6).fill(200));
      expect(
        (
          await db
            .prepare(
              'SELECT CAST(COUNT(*) AS INTEGER) n FROM evaluations WHERE submission_id=?',
            )
            .get(d.id)
        )?.n,
      ).toBe(1);
      expect(
        (
          await db
            .prepare(
              "SELECT CAST(COUNT(*) AS INTEGER) n FROM domain_events WHERE submission_id=? AND type='EVALUATION_COMPLETED'",
            )
            .get(d.id)
        )?.n,
      ).toBe(1);
    });
    it('rolls back state, evaluation and earlier events when the final event fails', async () => {
      const d = await setup();
      await call(
        `/submissions/${d.id}/transcription`,
        { version: 1, lines: ['x=7'] },
        d.cookie,
        'PATCH',
      );
      const query = async (sql: string, values: Value[]) => {
        if (
          sql.includes('INSERT INTO domain_events') &&
          values.includes('EVALUATION_COMPLETED')
        )
          throw new Error('injected storage outage');
        return db.prepare(sql).all(...values);
      };
      const failing = new Database({
        kind: engine,
        query,
        transaction: (fn, write) => db.transaction(() => fn({ query }), write),
        close: async () => {},
      });
      app = createApp(failing);
      const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        expect(
          (
            await call(
              `/submissions/${d.id}/confirm`,
              { version: 2, confirmed: true },
              d.cookie,
            )
          ).status,
        ).toBe(500);
      } finally {
        errorLog.mockRestore();
      }
      expect(
        (await db.prepare('SELECT state FROM submissions WHERE id=?').get(d.id))
          ?.state,
      ).toBe('MANUAL_ENTRY');
      expect(
        (
          await db
            .prepare(
              'SELECT CAST(COUNT(*) AS INTEGER) n FROM evaluations WHERE submission_id=?',
            )
            .get(d.id)
        )?.n,
      ).toBe(0);
      expect(
        (
          await db
            .prepare(
              "SELECT CAST(COUNT(*) AS INTEGER) n FROM domain_events WHERE submission_id=? AND type='TRANSCRIPTION_CONFIRMED'",
            )
            .get(d.id)
        )?.n,
      ).toBe(0);
    });
    it('recovers the transaction client after an exception', async () => {
      await expect(
        db.transaction(async () => {
          await db.prepare('SELECT 1').get();
          throw new Error('rollback');
        }),
      ).rejects.toThrow('rollback');
      expect(await db.prepare('SELECT 42 answer').get()).toEqual({
        answer: 42,
      });
    });
  },
);
it('preserves quoted question marks while binding PostgreSQL parameters', () => {
  expect(
    postgresParameters(`SELECT '?' AS "?", '?' || ?, 'it''s ?' WHERE id=?`),
  ).toBe(`SELECT '?' AS "?", '?' || $1, 'it''s ?' WHERE id=$2`);
});
it('applies migrations once and rejects historical SQL edits', async () => {
  const { db } = await testPostgres();
  try {
    const sql = await readFile(
      new URL(
        '../../packages/database/migrations/0001_postgresql.sql',
        import.meta.url,
      ),
      'utf8',
    );
    expect(await applyMigration(db, 1, sql)).toBe(false);
    await expect(
      applyMigration(db, 1, `${sql}\n-- unexpected edit`),
    ).rejects.toThrow('checksum mismatch');
    await expect(
      applyMigration(
        db,
        2,
        'CREATE TABLE incomplete(id INTEGER); SELECT missing_column;',
      ),
    ).rejects.toThrow();
    expect(
      await db
        .prepare(
          "SELECT table_name FROM information_schema.tables WHERE table_name='incomplete'",
        )
        .get(),
    ).toBeUndefined();
    expect(
      await db
        .prepare('SELECT version FROM schema_migrations WHERE version=2')
        .get(),
    ).toBeUndefined();
  } finally {
    await db.close();
  }
});
