import { readFile } from 'node:fs/promises';
import {
  applyMigration,
  migrationFiles,
} from '../packages/database/src/migrations.ts';
import { openPostgres } from '../packages/database/src/postgres.ts';
if (!process.env.DATABASE_URL)
  throw new Error('DATABASE_URL is required; no database was modified');
const db = openPostgres(process.env.DATABASE_URL);
try {
  for (const [index, file] of migrationFiles.entries()) {
    const sql = await readFile(
      new URL(`../packages/database/migrations/${file}`, import.meta.url),
      'utf8',
    );
    await applyMigration(db, index + 1, sql);
  }
  console.log('PostgreSQL migrations verified');
} finally {
  await db.close();
}
