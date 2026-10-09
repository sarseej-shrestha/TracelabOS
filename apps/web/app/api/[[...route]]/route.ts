import { createApp } from '../../../../../services/api/src/app.ts';
import { openDatabase } from '../../../../../packages/database/src/local.ts';
export const runtime = 'nodejs';
const globalStore = globalThis as unknown as {
  tracelabApi?: ReturnType<typeof createApp>;
};
const app = (globalStore.tracelabApi ??= createApp(
  openDatabase(process.env.TRACELAB_DB_PATH ?? '.data/tracelab.db'),
));
export const GET = (request: Request) => app.fetch(request);
export const POST = GET;
export const PATCH = GET;
