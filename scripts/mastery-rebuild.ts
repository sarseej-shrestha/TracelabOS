import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import { Database, type Value } from '../packages/database/src/adapter.ts';
import { openPostgres } from '../packages/database/src/postgres.ts';
import { rebuildMastery } from '../services/api/src/mastery-rebuild.ts';
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--apply') || args.length > 1)
  throw new Error('Usage: pnpm mastery:rebuild [--apply]');
const apply = args.includes('--apply');
if (Boolean(process.env.DATABASE_URL) === Boolean(process.env.TRACELAB_DB_PATH))
  throw new Error(
    'Select exactly one DATABASE_URL or existing TRACELAB_DB_PATH',
  );
function local(path: string) {
  if (!existsSync(path))
    throw new Error(
      'The selected database must already exist; no database was created',
    );
  const sqlite = new DatabaseSync(path, { readOnly: !apply });
  sqlite.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000');
  const query = async (sql: string, values: Value[]) =>
    sqlite.prepare(sql).all(...values);
  return new Database({
    kind: 'local-sqlite',
    query,
    transaction: async (fn, write) => {
      sqlite.exec(write ? 'BEGIN IMMEDIATE' : 'BEGIN');
      try {
        const result = await fn({ query });
        sqlite.exec('COMMIT');
        return result;
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    close: async () => sqlite.close(),
  });
}
const db = process.env.DATABASE_URL
  ? openPostgres(process.env.DATABASE_URL)
  : local(process.env.TRACELAB_DB_PATH!);
try {
  console.log(JSON.stringify(await rebuildMastery(db, apply), null, 2));
} finally {
  await db.close();
}
