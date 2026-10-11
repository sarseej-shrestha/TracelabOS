export interface CloudBridgeEnv {
  TRACELAB_BACKEND_URL?: string;
  TRACELAB_BRIDGE_SECRET?: string;
  TRACELAB_PUBLIC_ORIGIN?: string;
}
const unavailable = () =>
  Response.json(
    { error: 'SERVICE_UNAVAILABLE' },
    { status: 503, headers: { 'cache-control': 'no-store' } },
  );
/** Forward only the fixed application's API, never arbitrary client-supplied destinations. */
export async function proxyRequest(
  request: Request,
  env: CloudBridgeEnv,
  transport: typeof fetch = fetch,
): Promise<Response> {
  try {
    const source = new URL(request.url);
    if (!source.pathname.startsWith('/api/'))
      return new Response(null, { status: 404 });
    const target = new URL(env.TRACELAB_BACKEND_URL ?? '');
    if (
      target.protocol !== 'https:' ||
      !/^[a-z0-9-]+\.compute\.c-\d+\.[a-z0-9-]+\.aws\.neon\.tech$/.test(
        target.hostname,
      ) ||
      target.username ||
      target.password ||
      target.port ||
      target.pathname !== '/' ||
      target.search ||
      target.hash ||
      !/^[a-f0-9]{64}$/.test(env.TRACELAB_BRIDGE_SECRET ?? '') ||
      !env.TRACELAB_PUBLIC_ORIGIN
    )
      return unavailable();
    if (!['GET', 'HEAD', 'POST', 'PATCH'].includes(request.method))
      return new Response(null, { status: 405 });
    if (
      !['GET', 'HEAD'].includes(request.method) &&
      request.headers.get('origin') !== env.TRACELAB_PUBLIC_ORIGIN
    )
      return Response.json({ error: 'ORIGIN_REQUIRED' }, { status: 403 });
    const length = request.headers.get('content-length');
    if (length && (!/^\d+$/.test(length) || Number(length) > 5 * 1024 * 1024))
      return Response.json({ error: 'BODY_TOO_LARGE' }, { status: 413 });
    target.pathname = source.pathname;
    target.search = source.search;
    const headers = new Headers();
    for (const name of ['accept', 'cookie', 'content-type', 'origin']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('x-tracelab-bridge', env.TRACELAB_BRIDGE_SECRET!);
    const response = await transport(target, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
      // Node requires duplex for streaming bodies; workerd ignores it.
      ...{ duplex: 'half' },
      redirect: 'manual',
      signal: AbortSignal.timeout(30000),
    });
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      return unavailable();
    }
    const result = new Response(response.body, response);
    result.headers.set('cache-control', 'private, no-store');
    result.headers.set('x-content-type-options', 'nosniff');
    return result;
  } catch {
    return unavailable();
  }
}
export const handleRequest = (request: Request) =>
  proxyRequest(request, {
    TRACELAB_BACKEND_URL: process.env.TRACELAB_BACKEND_URL,
    TRACELAB_BRIDGE_SECRET: process.env.TRACELAB_BRIDGE_SECRET,
    TRACELAB_PUBLIC_ORIGIN: process.env.TRACELAB_PUBLIC_ORIGIN,
  });
