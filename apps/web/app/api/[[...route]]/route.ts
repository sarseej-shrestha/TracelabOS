import { createApp } from '../../../../../services/api/src/app.ts';
import { openDatabase } from '../../../../../packages/database/src/local.ts';
export const runtime = 'nodejs';
const globalStore = globalThis as unknown as {
  tracelabApi?: ReturnType<typeof createApp>;
};
const app = (globalStore.tracelabApi ??= createApp(
  openDatabase(process.env.TRACELAB_DB_PATH ?? '.data/tracelab.db'),
  {
    allowedOrigins: process.env.TRACELAB_PUBLIC_ORIGIN
      ? [new URL(process.env.TRACELAB_PUBLIC_ORIGIN).origin]
      : ['http://127.0.0.1:3000', 'http://localhost:3000'],
  },
));
export const GET = (request: Request) => app.fetch(request);
export const POST = GET;
export const PATCH = GET;
