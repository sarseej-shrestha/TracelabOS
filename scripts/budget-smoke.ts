/** Actual two-pool PostgreSQL concurrency check in a uniquely owned, temporary schema. */
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { Database, type Value } from '../packages/database/src/adapter.ts';
import { openPostgres } from '../packages/database/src/postgres.ts';
import {
  publicDemoBudgets,
  reserveResources,
  ResourceLimit,
} from '../services/api/src/resource-budgets.ts';
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
const schema = `tracelab_budget_smoke_${randomUUID().replaceAll('-', '')}`;
const source = await readFile(
  new URL(
    '../packages/database/migrations/0006_resource_budgets.sql',
    import.meta.url,
  ),
  'utf8',
);
const pools = [
  openPostgres(process.env.DATABASE_URL),
  openPostgres(process.env.DATABASE_URL),
];
const scoped = (db: Database) => {
  const executor = {
    query: (sql: string, values: Value[]) =>
      db
        .prepare(
          sql.replaceAll('resource_budgets', `"${schema}".resource_budgets`),
        )
        .all(...values),
  };
  return new Database({
    kind: 'isolated-neon-smoke',
    ...executor,
    transaction: (fn, write) => db.transaction(() => fn(executor), write),
    close: async () => {},
  });
};
let created = false;
let tableCreated = false;
let result: object | undefined;
try {
  await pools[0]!.prepare(`CREATE SCHEMA "${schema}"`).run();
  created = true;
  const databases = pools.map(scoped);
  await databases[0]!.prepare(source).run();
  tableCreated = true;
  const limits = { ...publicDemoBudgets, uploads: { daily: 5, lifetime: 6 } };
  const timestamp = Date.now();
  const results = await Promise.allSettled(
    Array.from({ length: 16 }, (_, i) =>
      reserveResources(
        databases[i % 2]!,
        { uploads: 1, mutations: 1 },
        limits,
        timestamp,
      ),
    ),
  );
  assert.equal(results.filter((r) => r.status === 'fulfilled').length, 5);
  const rejected = results.filter((r) => r.status === 'rejected');
  assert.equal(rejected.length, 11);
  for (const item of rejected) assert.ok(item.reason instanceof ResourceLimit);
  assert.equal(
    Number(
      (
        await databases[1]!
          .prepare(
            "SELECT total_used FROM resource_budgets WHERE resource='mutations'",
          )
          .get()
      )?.total_used,
    ),
    5,
  );
  await pools[0]!.close();
  pools[0] = openPostgres(process.env.DATABASE_URL);
  const restarted = scoped(pools[0]);
  assert.equal(
    Number(
      (
        await restarted
          .prepare(
            "SELECT total_used FROM resource_budgets WHERE resource='uploads'",
          )
          .get()
      )?.total_used,
    ),
    5,
  );
  await reserveResources(
    restarted,
    { uploads: 1 },
    limits,
    timestamp + 86400000,
  );
  await assert.rejects(
    reserveResources(
      restarted,
      { uploads: 1 },
      limits,
      timestamp + 2 * 86400000,
    ),
    (error: unknown) =>
      error instanceof ResourceLimit && error.retryAt === null,
  );
  result = {
    measuredAt: new Date().toISOString(),
    database: 'existing Neon PostgreSQL',
    isolatedTemporarySchema: true,
    independentPools: 2,
    concurrentReservations: 16,
    accepted: 5,
    rejected: 11,
    partialReservationsRolledBack: true,
    reconnectPreservesUsage: true,
    utcRolloverAndLifetime: 'passed',
    productionRecordsOrBudgetsModified: false,
  };
} catch {
  console.error(
    'Isolated Neon budget verification failed; credentials and provider error withheld',
  );
  process.exitCode = 1;
} finally {
  try {
    if (tableCreated)
      await pools[1]!.prepare(`DROP TABLE "${schema}".resource_budgets`).run();
    if (created) await pools[1]!.prepare(`DROP SCHEMA "${schema}"`).run();
  } catch {
    console.error(
      'Temporary schema cleanup failed; inspect the isolated tracelab_budget_smoke schemas before retrying',
    );
    process.exitCode = 1;
  }
  await Promise.allSettled(pools.map((db) => db.close()));
}
if (!process.exitCode && result) {
  const evidence = { ...result, temporarySchemaRemoved: true };
  await writeFile(
    'artifacts/neon-budget-smoke.json',
    JSON.stringify(evidence, null, 2) + '\n',
  );
  console.log(JSON.stringify(evidence));
}
