import { PGlite } from '@electric-sql/pglite';
import { applyMigration } from '../../packages/database/src/migrations.ts';
import { readFile } from 'node:fs/promises';
import {
  Database,
  postgresParameters,
  type Row,
} from '../../packages/database/src/adapter.ts';
export async function testPostgres() {
  const pg = new PGlite();
  const db = new Database({
    kind: 'test-postgresql',
    query: async (sql, values) =>
      (await pg.query<Row>(postgresParameters(sql), values)).rows,
    transaction: (fn) =>
      pg.transaction((tx) =>
        fn({
          query: async (sql, values) =>
            (await tx.query<Row>(postgresParameters(sql), values)).rows,
        }),
      ),
    close: () => pg.close(),
  });
  await applyMigration(
    db,
    1,
    await readFile(
      new URL(
        '../../packages/database/migrations/0001_postgresql.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  return { db, pg };
}
