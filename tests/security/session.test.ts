import { beforeEach, afterEach, expect, it } from 'vitest';
import { createApp } from '../../services/api/src/app.ts';
import { openDatabase, type DB } from '../../packages/database/src/local.ts';
let db: DB, app: ReturnType<typeof createApp>;
beforeEach(() => {
  db = openDatabase(':memory:');
  app = createApp(db);
});
afterEach(() => db.close());
async function request(
  path: string,
  method = 'GET',
  body?: unknown,
  cookie = '',
) {
  return app.request(`https://demo.example/api${path}`, {
    method,
    headers: {
      origin: 'https://demo.example',
      'content-type': 'application/json',
      cookie,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function demo() {
  const r = await request('/demo', 'POST');
  return {
    cookie: r.headers.get('set-cookie')!.split(';')[0]!,
    ...((await r.json()) as { room: string; student: string }),
  };
}
it('marks HTTPS cookies Secure and stores only token hashes', async () => {
  const r = await request('/demo', 'POST');
  const cookie = r.headers.get('set-cookie')!;
  expect(cookie).toContain('Secure');
  const token = cookie.split(';')[0]!.split('=')[1];
  expect(
    db.prepare('SELECT token_hash FROM sessions').get()?.token_hash,
  ).not.toBe(token);
});
it('rejects expired sessions', async () => {
  const d = await demo();
  db.prepare('UPDATE sessions SET expires_at=0').run();
  expect((await request('/me', 'GET', undefined, d.cookie)).status).toBe(401);
});
it('invalidates the old token during a demo role switch', async () => {
  const d = await demo();
  await request('/demo/role', 'POST', { role: 'teacher' }, d.cookie);
  expect((await request('/me', 'GET', undefined, d.cookie)).status).toBe(401);
});
it('keeps role switching inside the authenticated demo space', async () => {
  const a = await demo(),
    b = await demo();
  const role = await request(
    '/demo/role',
    'POST',
    { role: 'teacher' },
    a.cookie,
  );
  const teacherCookie = role.headers.get('set-cookie')!.split(';')[0]!;
  expect(
    (
      await request(
        `/classrooms/${b.room}/submissions`,
        'GET',
        undefined,
        teacherCookie,
      )
    ).status,
  ).toBe(404);
});
it('does not expose internal columns in identity responses', async () => {
  const d = await demo();
  const me = await (await request('/me', 'GET', undefined, d.cookie)).json();
  expect(me.password_hash).toBeUndefined();
  expect(me.demo_space).toBeUndefined();
  expect(me.username).toContain('fictional');
});
it('caps anonymous requests without trusting spoofed IP headers', async () => {
  for (let i = 0; i < 120; i++)
    expect((await request('/health')).status).toBe(200);
  expect(
    (
      await app.request('https://demo.example/api/health', {
        headers: { 'x-forwarded-for': '8.8.8.8' },
      })
    ).status,
  ).toBe(429);
});
it('rejects oversize upload bodies before decoding', async () => {
  const d = await demo();
  const response = await app.request(
    'https://demo.example/api/submissions/missing/image',
    {
      method: 'POST',
      headers: {
        origin: 'https://demo.example',
        cookie: d.cookie,
        'content-type': 'image/png',
      },
      body: new Uint8Array(5 * 1024 * 1024 + 1),
    },
  );
  expect(response.status).toBe(413);
});

it('accepts configured public origin behind a rewriting reverse proxy', async () => {
  app = createApp(db, { allowedOrigins: ['https://public.example'] });
  const r = await app.request('http://internal:3000/api/demo', {
    method: 'POST',
    headers: { origin: 'https://public.example' },
  });
  expect(r.status).toBe(201);
  expect(r.headers.get('set-cookie')).toContain('Secure');
});
it('never trusts a forged forwarded host to expand allowed origins', async () => {
  app = createApp(db, { allowedOrigins: ['https://public.example'] });
  const r = await app.request('http://internal:3000/api/demo', {
    method: 'POST',
    headers: {
      origin: 'https://evil.example',
      'x-forwarded-host': 'evil.example',
      host: 'evil.example',
    },
  });
  expect(r.status).toBe(403);
});
it('does not allow internal-origin mutations when public origins are configured', async () => {
  app = createApp(db, { allowedOrigins: ['https://public.example'] });
  expect(
    (
      await app.request('http://internal:3000/api/demo', {
        method: 'POST',
        headers: { origin: 'http://internal:3000' },
      })
    ).status,
  ).toBe(403);
});
