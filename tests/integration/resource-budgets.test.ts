import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { openDatabase } from '../../packages/database/src/local.ts';
import {
  asDatabase,
  type Database,
} from '../../packages/database/src/adapter.ts';
import { testPostgres } from '../helpers/postgres.ts';
import { createApp } from '../../services/api/src/app.ts';
import {
  publicDemoBudgets,
  requestResources,
  reserveResources,
  ResourceLimit,
  type ResourcePolicies,
} from '../../services/api/src/resource-budgets.ts';
import type { ImageStore } from '../../packages/vision-adapter/src/storage.ts';
const midnight = Date.parse('2026-10-11T00:00:00Z');
const dayMs = 86400000;
function policy(overrides: Partial<ResourcePolicies> = {}): ResourcePolicies {
  return { ...publicDemoBudgets, ...overrides };
}
function post(
  app: ReturnType<typeof createApp>,
  path: string,
  body?: unknown,
  cookie = '',
) {
  return app.request(`http://localhost/api${path}`, {
    method: 'POST',
    headers: {
      origin: 'http://localhost',
      'content-type': 'application/json',
      cookie,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
describe.each(['sqlite', 'postgres'] as const)(
  '%s durable resource budgets',
  (engine) => {
    let db: Database;
    beforeAll(async () => {
      db =
        engine === 'sqlite'
          ? asDatabase(openDatabase(':memory:'))
          : (await testPostgres()).db;
    });
    beforeEach(async () => {
      await db.prepare('DELETE FROM resource_budgets').run();
    });
    afterAll(async () => {
      await db.close();
    });
    it('shares capacity between independent API instances and rejects concurrent overspending atomically', async () => {
      const before = Number(
        (await db.prepare('SELECT COUNT(*) n FROM users').get())?.n,
      );
      const limits = policy({ identities: { daily: 6, lifetime: 100 } });
      const apps = [
        createApp(db, { resourceBudgets: limits }),
        createApp(db, { resourceBudgets: limits }),
      ];
      const results = await Promise.all(
        Array.from({ length: 12 }, (_, i) => post(apps[i % 2]!, '/demo')),
      );
      expect(results.filter((r) => r.status === 201)).toHaveLength(3);
      expect(results.filter((r) => r.status === 429)).toHaveLength(9);
      expect(
        Number((await db.prepare('SELECT COUNT(*) n FROM users').get())?.n) -
          before,
      ).toBe(6);
      expect(
        Number(
          (
            await db
              .prepare(
                "SELECT total_used FROM resource_budgets WHERE resource='identities'",
              )
              .get()
          )?.total_used,
        ),
      ).toBe(6);
      expect(
        Number(
          (
            await db
              .prepare(
                "SELECT total_used FROM resource_budgets WHERE resource='mutations'",
              )
              .get()
          )?.total_used,
        ),
      ).toBe(3);
      const rejected = results.find((r) => r.status === 429)!;
      expect(Number(rejected.headers.get('retry-after'))).toBeGreaterThan(0);
      expect(await rejected.json()).toMatchObject({
        error: 'DEMO_DAILY_LIMIT',
      });
    });
    it('keeps failed password attempts reserved after handler rollback and app recreation', async () => {
      const limits = policy({ authentication: { daily: 1 } });
      const body = {
        username: 'nonexistent-user',
        password: 'not-a-real-password',
      };
      expect(
        (
          await post(
            createApp(db, { resourceBudgets: limits }),
            '/auth/login',
            body,
          )
        ).status,
      ).toBe(401);
      expect(
        (
          await post(
            createApp(db, { resourceBudgets: limits }),
            '/auth/login',
            body,
          )
        ).status,
      ).toBe(429);
      expect(
        Number(
          (
            await db
              .prepare(
                "SELECT total_used FROM resource_budgets WHERE resource='authentication'",
              )
              .get()
          )?.total_used,
        ),
      ).toBe(1);
    });
    it('resets at UTC midnight, retaining lifetime usage and refusing a backward clock', async () => {
      const limits = policy({ uploads: { daily: 2, lifetime: 3 } });
      await reserveResources(db, { uploads: 2 }, limits, midnight - 1);
      await expect(
        reserveResources(db, { uploads: 1 }, limits, midnight - 1),
      ).rejects.toMatchObject({ retryAt: midnight });
      await expect(
        reserveResources(db, { uploads: 1 }, limits, midnight - dayMs - 1),
      ).rejects.toBeInstanceOf(ResourceLimit);
      await reserveResources(db, { uploads: 1 }, limits, midnight);
      await expect(
        reserveResources(db, { uploads: 1 }, limits, midnight + dayMs),
      ).rejects.toMatchObject({ retryAt: null });
      expect(
        Number(
          (
            await db
              .prepare(
                "SELECT total_used FROM resource_budgets WHERE resource='uploads'",
              )
              .get()
          )?.total_used,
        ),
      ).toBe(3);
      expect(
        Number(
          (
            await db
              .prepare(
                "SELECT day_used FROM resource_budgets WHERE resource='uploads'",
              )
              .get()
          )?.day_used,
        ),
      ).toBe(1);
    });
    it('rolls back all counters when a later resource is exhausted', async () => {
      await expect(
        reserveResources(
          db,
          { authentication: 1, identities: 1 },
          policy({ identities: { daily: 0 } }),
          midnight,
        ),
      ).rejects.toBeInstanceOf(ResourceLimit);
      expect(await db.prepare('SELECT * FROM resource_budgets').all()).toEqual(
        [],
      );
    });
    it('leaves GET and logout usable when mutation capacity is exhausted', async () => {
      const app = createApp(db);
      const demo = await post(app, '/demo');
      const cookie = demo.headers.get('set-cookie')!.split(';')[0]!;
      const limited = createApp(db, {
        resourceBudgets: policy({ mutations: { daily: 0 } }),
      });
      expect(
        (await limited.request('http://localhost/api/health')).status,
      ).toBe(200);
      expect(
        (
          await limited.request('http://localhost/api/me', {
            headers: { cookie },
          })
        ).status,
      ).toBe(200);
      expect(
        (await post(limited, '/auth/logout', undefined, cookie)).status,
      ).toBe(200);
      expect((await post(limited, '/demo')).status).toBe(429);
    });
    it('does not consume quota for rejected origins or oversized bodies', async () => {
      const app = createApp(db, { resourceBudgets: policy() });
      expect(
        (await app.request('http://localhost/api/demo', { method: 'POST' }))
          .status,
      ).toBe(403);
      expect(
        (
          await app.request('http://localhost/api/demo', {
            method: 'POST',
            headers: { origin: 'http://localhost' },
            body: 'x'.repeat(5 * 1024 * 1024 + 1),
          })
        ).status,
      ).toBe(413);
      expect(await db.prepare('SELECT * FROM resource_budgets').all()).toEqual(
        [],
      );
    });
    it('charges invalid image attempts and blocks subsequent storage, while manual transcription works', async () => {
      const put = vi.fn(async () => {});
      const store: ImageStore = {
        kind: 'test',
        put,
        get: async () => new Uint8Array(),
        delete: async () => {},
        list: async () => ({ objects: [] }),
      };
      const app = createApp(db, {
        imageStore: store,
        resourceBudgets: policy({ uploads: { daily: 1, lifetime: 10 } }),
      });
      const response = await post(app, '/demo');
      const cookie = response.headers.get('set-cookie')!.split(';')[0]!;
      const demo = (await response.json()) as { assignment: string };
      const sub = (await (
        await post(
          app,
          '/submissions',
          { assignmentId: demo.assignment },
          cookie,
        )
      ).json()) as { id: string };
      const image = async (bytes: Uint8Array) =>
        app.request(`http://localhost/api/submissions/${sub.id}/image`, {
          method: 'POST',
          headers: {
            origin: 'http://localhost',
            'content-type': 'image/png',
            cookie,
          },
          body: Buffer.from(bytes),
        });
      expect((await image(new Uint8Array([1, 2, 3]))).status).toBe(400);
      const png = await sharp({
        create: { width: 8, height: 8, channels: 3, background: 'white' },
      })
        .png()
        .toBuffer();
      const denied = await image(png);
      expect(denied.status).toBe(429);
      expect(((await denied.json()) as { message: string }).message).toContain(
        'manually',
      );
      expect(put).not.toHaveBeenCalled();
      expect(
        (
          await app.request(
            `http://localhost/api/submissions/${sub.id}/transcription`,
            {
              method: 'PATCH',
              headers: {
                origin: 'http://localhost',
                'content-type': 'application/json',
                cookie,
              },
              body: JSON.stringify({ version: 1, lines: ['3(x-2)=15', 'x=7'] }),
            },
          )
        ).status,
      ).toBe(200);
    });
    it('fails closed when budget persistence is unavailable', async () => {
      const spy = vi
        .spyOn(db, 'transaction')
        .mockRejectedValueOnce(new Error('offline'));
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        expect(
          (await post(createApp(db, { resourceBudgets: policy() }), '/demo'))
            .status,
        ).toBe(500);
      } finally {
        spy.mockRestore();
        log.mockRestore();
      }
      expect(await db.prepare('SELECT * FROM resource_budgets').all()).toEqual(
        [],
      );
    });
    it.each([0, -1, 0.5, NaN, Number.MAX_SAFE_INTEGER + 1])(
      'rejects invalid reservation %s without a counter',
      async (units) => {
        await expect(
          reserveResources(db, { uploads: units }, policy(), midnight),
        ).rejects.toThrow('Invalid budget reservation');
        expect(
          await db.prepare('SELECT * FROM resource_budgets').all(),
        ).toEqual([]);
      },
    );
    it.each([-1, 0.5, NaN, Infinity])(
      'rejects invalid server configuration %s',
      (daily) => {
        expect(() =>
          createApp(db, { resourceBudgets: policy({ mutations: { daily } }) }),
        ).toThrow('Invalid resource budget configuration');
      },
    );
  },
);
it('maps only known expensive request paths to their extra resource, counting two demo identities', () => {
  expect(requestResources('POST', '/api/demo')).toEqual({
    mutations: 1,
    identities: 2,
  });
  expect(requestResources('POST', '/api/auth/register')).toEqual({
    mutations: 1,
    identities: 1,
    authentication: 1,
  });
  expect(requestResources('GET', '/api/submissions/id/image')).toEqual({});
  expect(requestResources('POST', '/api/submissions/id/image')).toEqual({
    mutations: 1,
    uploads: 1,
  });
});
it('migrates SQLite additively and preserves budgets across file reopen', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'tracelab-budgets-'));
  const path = join(directory, 'database.db');
  let local = openDatabase(path);
  try {
    local.exec(
      'DROP TABLE resource_budgets; DELETE FROM schema_migrations WHERE version=6',
    );
    local
      .prepare('INSERT INTO users VALUES(?,?,?,?,?,?)')
      .run('t', 'retained-teacher', null, 'teacher', null, '2026-10-11');
    local.close();
    local = openDatabase(path);
    await reserveResources(
      asDatabase(local),
      { uploads: 1 },
      policy(),
      midnight,
    );
    local.close();
    local = openDatabase(path);
    expect(local.prepare('SELECT username FROM users').get()?.username).toBe(
      'retained-teacher',
    );
    expect(
      local.prepare('SELECT total_used FROM resource_budgets').get()
        ?.total_used,
    ).toBe(1);
    expect(
      local
        .prepare('SELECT COUNT(*) n FROM schema_migrations WHERE version=6')
        .get()?.n,
    ).toBe(1);
  } finally {
    local.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
