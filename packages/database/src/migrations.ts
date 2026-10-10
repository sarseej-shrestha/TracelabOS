export const migrationFiles = [
  '0001_postgresql.sql',
  '0002_image_references.sql',
  '0003_ocr_jobs.sql',
  '0004_reviewed_mastery.sql',
] as const;
import { createHash } from 'node:crypto';
import type { Database } from './adapter.ts';
/** Apply static repository SQL atomically; reject edits to an already-applied migration. */
export async function applyMigration(
  db: Database,
  version: number,
  sql: string,
) {
  const checksum = createHash('sha256').update(sql).digest('hex');
  return db.transaction(async () => {
    await db
      .prepare(
        'CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL, checksum TEXT NOT NULL)',
      )
      .run();
    const previous = await db
      .prepare('SELECT checksum FROM schema_migrations WHERE version=?')
      .get(version);
    if (previous) {
      if (previous.checksum !== checksum)
        throw new Error('Applied migration checksum mismatch');
      return false;
    }
    for (const statement of sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean))
      await db.prepare(statement).run();
    await db
      .prepare('INSERT INTO schema_migrations VALUES(?,?,?)')
      .run(version, new Date().toISOString(), checksum);
    return true;
  });
}
