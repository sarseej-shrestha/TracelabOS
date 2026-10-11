import { beforeEach, expect, it, vi } from 'vitest';
const pool = vi.hoisted(() => ({
  query: vi.fn(),
  clientQuery: vi.fn(),
  connect: vi.fn(),
  release: vi.fn(),
  end: vi.fn(),
  config: vi.fn(),
}));
vi.mock('pg', async (original) => ({
  ...(await original<typeof import('pg')>()),
  Pool: class {
    constructor(config: unknown) {
      pool.config(config);
    }
    query = pool.query;
    connect = pool.connect;
    end = pool.end;
  },
}));
import { openPostgres } from '../../packages/database/src/postgres.ts';
import { ChannelBoundClient } from '../../packages/database/src/channel-bound-client.ts';
const url =
  'postgres://fixture:fixture@ep-fixture.us-east-2.aws.neon.tech/neondb';
beforeEach(() => {
  vi.resetAllMocks();
  pool.query.mockResolvedValue({ rows: [{ value: 1 }] });
  pool.clientQuery.mockResolvedValue({ rows: [{ value: 2 }] });
  pool.connect.mockResolvedValue({
    query: pool.clientQuery,
    release: pool.release,
  });
  pool.end.mockResolvedValue(undefined);
});
it('uses the guarded client and parameterizes values without altering quoted text', async () => {
  const db = openPostgres(url);
  expect(pool.config.mock.calls[0]![0].Client).toBe(ChannelBoundClient);
  expect(
    await db.prepare("SELECT ? AS value, '?' AS literal").get('private'),
  ).toEqual({ value: 1 });
  expect(pool.query).toHaveBeenCalledWith(
    "SELECT $1 AS value, '?' AS literal",
    ['private'],
  );
  await db.close();
  expect(pool.end).toHaveBeenCalledOnce();
});
it('commits writes on the locked pooled client and always releases it', async () => {
  const db = openPostgres(url);
  expect(await db.transaction(() => db.prepare('SELECT ?').get(2))).toEqual({
    value: 2,
  });
  expect(pool.clientQuery.mock.calls.map(([sql]) => sql)).toEqual([
    'BEGIN',
    "SET LOCAL statement_timeout = '10s'",
    "SET LOCAL lock_timeout = '5s'",
    'SELECT pg_advisory_xact_lock(721006)',
    'SELECT $1',
    'COMMIT',
  ]);
  expect(pool.query).not.toHaveBeenCalled();
  expect(pool.release).toHaveBeenCalledOnce();
});
it('uses repeatable read-only snapshots without acquiring the write lock', async () => {
  const db = openPostgres(url);
  await db.transaction(() => db.prepare('SELECT 1').get(), false);
  expect(pool.clientQuery.mock.calls[0]![0]).toBe(
    'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
  );
  expect(pool.clientQuery).not.toHaveBeenCalledWith(
    'SELECT pg_advisory_xact_lock(721006)',
  );
  expect(pool.release).toHaveBeenCalledOnce();
});
it.each([false, true])(
  'preserves the original failure and releases the client when rollback fails=%s',
  async (rollbackFails) => {
    const db = openPostgres(url),
      original = Error('domain operation failed');
    if (rollbackFails)
      pool.clientQuery.mockImplementation(async (sql) => {
        if (sql === 'ROLLBACK') throw Error('connection lost');
        return { rows: [] };
      });
    await expect(
      db.transaction(async () => {
        throw original;
      }),
    ).rejects.toBe(original);
    expect(pool.clientQuery).toHaveBeenCalledWith('ROLLBACK');
    expect(pool.clientQuery).not.toHaveBeenCalledWith('COMMIT');
    expect(pool.release).toHaveBeenCalledOnce();
    expect(pool.release).toHaveBeenCalledWith(rollbackFails);
  },
);
