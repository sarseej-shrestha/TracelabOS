import { configuredVisionProvider } from '../../../packages/vision-adapter/src/http.ts';
import { configuredImageStore } from '../../../packages/vision-adapter/src/storage.ts';
import { createApp } from './app.ts';
import { openDatabase } from '../../../packages/database/src/local.ts';
import { openPostgres } from '../../../packages/database/src/postgres.ts';
const globalStore = globalThis as unknown as {
  tracelabApi?: ReturnType<typeof createApp>;
};
const app = (globalStore.tracelabApi ??= createApp(
  process.env.DATABASE_URL
    ? openPostgres(process.env.DATABASE_URL)
    : openDatabase(process.env.TRACELAB_DB_PATH ?? '.data/tracelab.db'),
  {
    imageStore: configuredImageStore(),
    visionProvider: configuredVisionProvider(),
    allowedOrigins: process.env.TRACELAB_PUBLIC_ORIGIN
      ? [new URL(process.env.TRACELAB_PUBLIC_ORIGIN).origin]
      : ['http://127.0.0.1:3000', 'http://localhost:3000'],
  },
));
export const handleRequest = (request: Request) => app.fetch(request);
