import { Pool } from '@neondatabase/serverless';
import { Database, postgresParameters, type Executor } from './adapter.ts';
/** Shared demo write lock protects read-check-write flows across server instances.
 * Reads use repeatable snapshots; per-classroom locking is a future measured optimization.
 */
export function openPostgres(connectionString: string) {
  const url = new URL(connectionString);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !url.hostname.endsWith('.neon.tech')
  )
    throw new Error('DATABASE_URL must be a Neon PostgreSQL connection string');
  const pool = new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 10000,
  });
  const executor = (client: Pick<Pool, 'query'>): Executor => ({
    query: async (sql, values) =>
      (await client.query(postgresParameters(sql), values)).rows,
  });
  return new Database({
    kind: 'neon-postgresql',
    ...executor(pool),
    transaction: async (fn, write) => {
      const client = await pool.connect();
      try {
        await client.query(
          write ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
        );
        await client.query("SET LOCAL statement_timeout = '10s'");
        await client.query("SET LOCAL lock_timeout = '5s'");
        if (write) await client.query('SELECT pg_advisory_xact_lock(721006)');
        const result = await fn(executor(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  });
}
