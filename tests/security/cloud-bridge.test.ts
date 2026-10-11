import { expect, it, vi } from 'vitest';
import { proxyRequest } from '../../services/api/src/cloud-proxy.ts';
import { bridgeAuthorized } from '../../services/api/src/bridge-auth.ts';
const secret = 'a'.repeat(64);
const env = {
  TRACELAB_BACKEND_URL:
    'https://br-demo-api.compute.c-6.us-east-2.aws.neon.tech',
  TRACELAB_BRIDGE_SECRET: secret,
  TRACELAB_PUBLIC_ORIGIN: 'https://tracelabos.example.workers.dev',
};
const request = (path = '/api/health', init: RequestInit = {}) =>
  new Request(`https://tracelabos.example.workers.dev${path}`, init);
it('proxies to a fixed backend and replaces client-controlled infrastructure headers', async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(
    new Response('ok', {
      headers: {
        'set-cookie':
          'tracelab_session=test; HttpOnly; Secure; SameSite=Strict',
      },
    }),
  );
  const response = await proxyRequest(
    request('/api/submissions?cursor=2', {
      method: 'POST',
      headers: {
        origin: env.TRACELAB_PUBLIC_ORIGIN,
        cookie: 'tracelab_session=test',
        'x-tracelab-bridge': 'forged',
        'x-forwarded-host': 'attacker.test',
        'content-type': 'application/json',
      },
      body: '{}',
    }),
    env,
    transport,
  );
  const [target, init] = transport.mock.calls[0]!;
  expect(String(target)).toBe(
    `${env.TRACELAB_BACKEND_URL}/api/submissions?cursor=2`,
  );
  const headers = new Headers(init?.headers);
  expect(headers.get('x-tracelab-bridge')).toBe(secret);
  expect(headers.get('x-forwarded-host')).toBeNull();
  expect(headers.get('cookie')).toBe('tracelab_session=test');
  expect(init?.redirect).toBe('manual');
  expect(await response.text()).toBe('ok');
  expect(response.headers.get('set-cookie')).toContain('HttpOnly');
  expect(response.headers.get('cache-control')).toBe('private, no-store');
});
it.each([
  'http://api.compute.neon.tech',
  'https://attacker.test',
  'https://api.compute.neon.tech.attacker.test',
  'https://user:password@api.compute.neon.tech',
  'https://api.compute.neon.tech/private',
  'https://api.compute.neon.tech?x=1',
])('rejects backend %s before transport', async (target) => {
  const transport = vi.fn<typeof fetch>();
  expect(
    (
      await proxyRequest(
        request(),
        { ...env, TRACELAB_BACKEND_URL: target },
        transport,
      )
    ).status,
  ).toBe(503);
  expect(transport).not.toHaveBeenCalled();
});
it.each(['', undefined, 'short'])(
  'fails closed without a strong bridge secret (%s)',
  async (value) => {
    const transport = vi.fn<typeof fetch>();
    expect(
      (
        await proxyRequest(
          request(),
          { ...env, TRACELAB_BRIDGE_SECRET: value },
          transport,
        )
      ).status,
    ).toBe(503);
    expect(transport).not.toHaveBeenCalled();
  },
);
it.each([undefined, 'https://attacker.test'])(
  'preserves CSRF protection with origin %s',
  async (origin) => {
    const transport = vi.fn<typeof fetch>();
    expect(
      (
        await proxyRequest(
          request('/api/demo', {
            method: 'POST',
            headers: origin ? { origin } : {},
          }),
          env,
          transport,
        )
      ).status,
    ).toBe(403);
    expect(transport).not.toHaveBeenCalled();
  },
);
it('rejects oversize requests before invoking the backend', async () => {
  const transport = vi.fn<typeof fetch>();
  expect(
    (
      await proxyRequest(
        request('/api/demo', {
          method: 'POST',
          headers: {
            origin: env.TRACELAB_PUBLIC_ORIGIN,
            'content-length': '5242881',
          },
        }),
        env,
        transport,
      )
    ).status,
  ).toBe(413);
  expect(transport).not.toHaveBeenCalled();
});
it('never follows a backend redirect carrying bridge credentials', async () => {
  const transport = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(null, {
      status: 302,
      headers: { location: 'https://attacker.test' },
    }),
  );
  expect((await proxyRequest(request(), env, transport)).status).toBe(503);
  expect(transport).toHaveBeenCalledTimes(1);
});
it('sanitizes transport failures', async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockRejectedValue(new Error('private transport detail'));
  const response = await proxyRequest(request(), env, transport);
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain('private transport detail');
});
it('rejects unsupported methods and non-API paths', async () => {
  const transport = vi.fn<typeof fetch>();
  expect((await proxyRequest(request('/', {}), env, transport)).status).toBe(
    404,
  );
  expect(
    (
      await proxyRequest(
        request('/api/demo', { method: 'DELETE' }),
        env,
        transport,
      )
    ).status,
  ).toBe(405);
  expect(transport).not.toHaveBeenCalled();
});
it.each(['', 'b'.repeat(64), 'a'.repeat(63), 'a'.repeat(65)])(
  'denies direct or invalid infrastructure credentials',
  (value) => {
    expect(
      bridgeAuthorized(
        request('/api/health', { headers: { 'x-tracelab-bridge': value } }),
        secret,
      ),
    ).toBe(false);
  },
);
it('accepts the exact infrastructure credential only when configured', () => {
  const r = request('/api/health', {
    headers: { 'x-tracelab-bridge': secret },
  });
  expect(bridgeAuthorized(r, secret)).toBe(true);
  expect(bridgeAuthorized(r, undefined)).toBe(false);
});
