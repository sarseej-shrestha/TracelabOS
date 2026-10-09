import type { DatabaseSync } from 'node:sqlite';
import type { Database, Value } from './adapter.ts';
const tables = [
  'users',
  'sessions',
  'classrooms',
  'classroom_memberships',
  'assignments',
  'submissions',
  'submission_images',
  'image_references',
  'transcription_versions',
  'evaluations',
  'teacher_reviews',
  'domain_events',
] as const;
/** Explicit one-time import into an empty, migrated target. Source is read only. */
export async function importLocal(source: DatabaseSync, target: Database) {
  source.exec('BEGIN');
  try {
    return await target.transaction(async () => {
      for (const table of tables) {
        const result = await target
          .prepare(`SELECT COUNT(*) n FROM ${table}`)
          .get();
        if (Number(result?.n) !== 0)
          throw new Error(
            'Import requires an empty target; no records were changed',
          );
      }
      const counts: Record<string, number> = {};
      for (const table of tables) {
        if (
          table === 'image_references' &&
          !source
            .prepare(
              "SELECT 1 FROM sqlite_master WHERE name='image_references'",
            )
            .get()
        ) {
          counts[table] = 0;
          continue;
        }
        const rows = source
          .prepare(
            `SELECT ${table === 'teacher_reviews' ? 'rowid,' : ''}* FROM ${table}`,
          )
          .all();
        for (const row of rows) {
          const columns = Object.keys(row);
          if (!columns.every((column) => /^[a-z_]+$/.test(column)))
            throw new Error('Unexpected source schema');
          await target
            .prepare(
              `INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map(() => '?').join(',')})`,
            )
            .run(...(Object.values(row) as Value[]));
        }
        counts[table] = rows.length;
      }
      for (const [table, column] of [
        ['domain_events', 'sequence'],
        ['teacher_reviews', 'rowid'],
      ])
        await target
          .prepare(
            `SELECT setval(pg_get_serial_sequence('${table}','${column}'), COALESCE(MAX(${column}),1), COUNT(*)>0) FROM ${table}`,
          )
          .get();
      return counts;
    });
  } finally {
    source.exec('ROLLBACK');
  }
}
