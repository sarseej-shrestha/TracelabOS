import { DatabaseSync } from 'node:sqlite';
import { openPostgres } from '../packages/database/src/postgres.ts';
import { importLocal } from '../packages/database/src/import-local.ts';
if (!process.env.DATABASE_URL || !process.env.TRACELAB_IMPORT_PATH)
  throw new Error(
    'DATABASE_URL and TRACELAB_IMPORT_PATH are required; no data was changed',
  );
const source = new DatabaseSync(process.env.TRACELAB_IMPORT_PATH, {
  readOnly: true,
});
const target = openPostgres(process.env.DATABASE_URL);
try {
  console.log(JSON.stringify({ imported: await importLocal(source, target) }));
} finally {
  source.close();
  await target.close();
}
