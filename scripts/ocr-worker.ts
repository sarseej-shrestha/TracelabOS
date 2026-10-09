import { openPostgres } from '../packages/database/src/postgres.ts';
import { asDatabase } from '../packages/database/src/adapter.ts';
import { openDatabase } from '../packages/database/src/local.ts';
import { configuredImageStore } from '../packages/vision-adapter/src/storage.ts';
import { configuredVisionProvider } from '../packages/vision-adapter/src/http.ts';
import { runOcrJob } from '../services/api/src/ocr.ts';
const provider = configuredVisionProvider();
if (!provider)
  throw new Error('Configure TRACELAB_OCR_URL and TRACELAB_OCR_TOKEN');
if (!process.env.DATABASE_URL && !process.env.TRACELAB_DB_PATH)
  throw new Error('Select DATABASE_URL or TRACELAB_DB_PATH explicitly');
const db = process.env.DATABASE_URL
  ? openPostgres(process.env.DATABASE_URL)
  : asDatabase(openDatabase(process.env.TRACELAB_DB_PATH!));
const store = configuredImageStore();
let stopping = false;
process.on('SIGINT', () => {
  stopping = true;
});
process.on('SIGTERM', () => {
  stopping = true;
});
try {
  do {
    const started = Date.now();
    const worked = await runOcrJob(db, provider, store);
    if (worked)
      console.log(
        JSON.stringify({
          event: 'ocr_job_processed',
          duration_ms: Date.now() - started,
          model_version: provider.version,
        }),
      );
    if (process.argv.includes('--once')) break;
    if (!worked) await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (!stopping);
} finally {
  await db.close();
}
