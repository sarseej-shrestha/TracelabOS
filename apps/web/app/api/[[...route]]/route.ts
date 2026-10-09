import { configuredImageStore } from '../../../../../packages/vision-adapter/src/storage.ts';
import { createApp } from '../../../../../services/api/src/app.ts';
import { openDatabase } from '../../../../../packages/database/src/local.ts';
import { openPostgres } from '../../../../../packages/database/src/postgres.ts';
export const runtime = 'nodejs';
const globalStore = globalThis as unknown as {
  tracelabApi?: ReturnType<typeof createApp>;
};
const app = (globalStore.tracelabApi ??= createApp(
  process.env.DATABASE_URL
    ? openPostgres(process.env.DATABASE_URL)
    : openDatabase(process.env.TRACELAB_DB_PATH ?? '.data/tracelab.db'),
  {
    imageStore: configuredImageStore(),
    allowedOrigins: process.env.TRACELAB_PUBLIC_ORIGIN
      ? [new URL(process.env.TRACELAB_PUBLIC_ORIGIN).origin]
      : ['http://127.0.0.1:3000', 'http://localhost:3000'],
  },
));
export const GET = (request: Request) => app.fetch(request);
export const POST = GET;
export const PATCH = GET;
