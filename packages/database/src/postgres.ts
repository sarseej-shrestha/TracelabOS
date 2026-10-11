import { Pool, type PoolConfig } from 'pg';
import { Database, postgresParameters, type Executor } from './adapter.ts';
import { ChannelBoundClient } from './channel-bound-client.ts';

/** Parse only supported URL options; never let pg's URL parser replace TLS policy. */
export function neonConnectionConfig(connectionString: string): PoolConfig {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new Error('Invalid Neon PostgreSQL connection string');
  }
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !/^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.neon\.tech$/.test(url.hostname) ||
    (url.port !== '' && url.port !== '5432') ||
    !url.username ||
    !url.password ||
    !/^\/[^/]+$/.test(url.pathname) ||
    url.hash
  )
    throw new Error('DATABASE_URL must be a Neon PostgreSQL connection string');
  for (const [name, value] of url.searchParams) {
    if (
      url.searchParams.getAll(name).length !== 1 ||
      (!(name === 'sslmode' && ['require', 'verify-full'].includes(value)) &&
        !(name === 'channel_binding' && value === 'require'))
    )
      throw new Error('Unsupported or unsafe Neon connection option');
  }
  try {
    return {
      host: url.hostname,
      port: 5432,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
      ssl: {
        rejectUnauthorized: true,
        servername: url.hostname,
        minVersion: 'TLSv1.2',
      },
      enableChannelBinding: true,
      Client: ChannelBoundClient,
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 10000,
    };
  } catch {
    throw new Error('Invalid Neon PostgreSQL connection encoding');
  }
}
/** Shared demo write lock protects read-check-write flows across server instances.
 * Reads use repeatable snapshots; per-classroom locking is a future measured optimization.
 */
export function openPostgres(connectionString: string) {
  const pool = new Pool(neonConnectionConfig(connectionString));
  const executor = (client: Pick<Pool, 'query'>): Executor => ({
    query: async (sql, values) =>
      (await client.query(postgresParameters(sql), values)).rows,
  });
  return new Database({
    kind: 'neon-postgresql',
    ...executor(pool),
    transaction: async (fn, write) => {
      const client = await pool.connect();
      let discard = false;
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
        await client.query('ROLLBACK').catch(() => {
          discard = true;
        });
        throw error;
      } finally {
        client.release(discard);
      }
    },
    close: () => pool.end(),
  });
}
