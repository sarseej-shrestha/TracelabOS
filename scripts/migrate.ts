import { readFile } from 'node:fs/promises';
import { applyMigration } from '../packages/database/src/migrations.ts';
import { openPostgres } from '../packages/database/src/postgres.ts';
if (!process.env.DATABASE_URL)
  throw new Error('DATABASE_URL is required; no database was modified');
const db = openPostgres(process.env.DATABASE_URL);
try {
  const sql = await readFile(
    new URL(
      '../packages/database/migrations/0001_postgresql.sql',
      import.meta.url,
    ),
    'utf8',
  );
  await applyMigration(db, 1, sql);
  console.log('PostgreSQL migration 1 verified');
} finally {
  await db.close();
}
