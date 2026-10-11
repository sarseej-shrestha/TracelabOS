import next from './.open-next/worker.js';
import {
  proxyRequest,
  type CloudBridgeEnv,
} from '../../services/api/src/cloud-proxy.ts';
interface WorkerEnv extends CloudBridgeEnv {
  API_RATE_LIMIT: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
}
export default {
  async fetch(request: Request, env: WorkerEnv, context: unknown) {
    if (new URL(request.url).pathname.startsWith('/api/')) {
      if (!env.API_RATE_LIMIT)
        return Response.json({ error: 'SERVICE_UNAVAILABLE' }, { status: 503 });
      const result = await env.API_RATE_LIMIT.limit({
        key: request.headers.get('cf-connecting-ip') ?? 'unknown',
      });
      if (!result.success)
        return Response.json(
          { error: 'RATE_LIMITED' },
          {
            status: 429,
            headers: { 'retry-after': '60', 'cache-control': 'no-store' },
          },
        );
      return proxyRequest(request, env);
    }
    return next.fetch(request, env, context);
  },
};
