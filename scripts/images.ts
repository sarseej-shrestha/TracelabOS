import { openPostgres } from '../packages/database/src/postgres.ts';
import { asDatabase } from '../packages/database/src/adapter.ts';
import { openDatabase } from '../packages/database/src/local.ts';
import { configuredImageStore } from '../packages/vision-adapter/src/storage.ts';
import {
  migrateStoredImages,
  reconcileImages,
} from '../services/api/src/images.ts';
const store = configuredImageStore();
if (!store)
  throw new Error('R2 configuration is required; no images were changed');
if (!process.env.DATABASE_URL && !process.env.TRACELAB_DB_PATH)
  throw new Error('Select DATABASE_URL or TRACELAB_DB_PATH explicitly');
const db = process.env.DATABASE_URL
  ? openPostgres(process.env.DATABASE_URL)
  : asDatabase(openDatabase(process.env.TRACELAB_DB_PATH!));
try {
  if (process.argv.includes('migrate'))
    console.log(
      JSON.stringify(
        await migrateStoredImages(db, store, process.argv.includes('--apply')),
      ),
    );
  else if (process.argv.includes('reconcile'))
    console.log(
      JSON.stringify(
        await reconcileImages(db, store, {
          apply: process.argv.includes('--delete'),
        }),
      ),
    );
  else
    throw new Error(
      'Choose migrate or reconcile; writes require --apply or --delete',
    );
} finally {
  await db.close();
}
