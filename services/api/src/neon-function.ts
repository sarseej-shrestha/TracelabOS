import { createApp } from './app.ts';
import { backendRelease } from './backend-release.ts';
import { bridgeAuthorized } from './bridge-auth.ts';
import { openPostgres } from '../../../packages/database/src/postgres.ts';
import { configuredImageStore } from '../../../packages/vision-adapter/src/storage.ts';
import { publicDemoBudgets } from './resource-budgets.ts';
let app: ReturnType<typeof createApp> | undefined;
export default {
  async fetch(request: Request) {
    if (!bridgeAuthorized(request, process.env.TRACELAB_BRIDGE_SECRET))
      return Response.json(
        { error: 'UNAUTHORIZED' },
        { status: 401, headers: { 'cache-control': 'no-store' } },
      );
    const release = backendRelease(
      process.env.TRACELAB_BUILD_SHA,
      process.env.TRACELAB_RELEASE_SHA,
    );
    if (
      !release ||
      !process.env.DATABASE_URL ||
      !process.env.TRACELAB_PUBLIC_ORIGIN
    )
      return Response.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
    app ??= createApp(openPostgres(process.env.DATABASE_URL), {
      imageStore: configuredImageStore(),
      allowedOrigins: [new URL(process.env.TRACELAB_PUBLIC_ORIGIN).origin],
      releaseSha: release,
      resourceBudgets: publicDemoBudgets,
    });
    return app.fetch(request);
  },
};
