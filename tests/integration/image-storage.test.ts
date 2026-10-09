import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { openDatabase } from '../../packages/database/src/local.ts';
import {
  asDatabase,
  Database,
  type Value,
} from '../../packages/database/src/adapter.ts';
import { createApp } from '../../services/api/src/app.ts';
import {
  reconcileImages,
  migrateStoredImages,
} from '../../services/api/src/images.ts';
import {
  StorageUnavailable,
  imagePrefix,
  type ImageStore,
} from '../../packages/vision-adapter/src/storage.ts';
import { testPostgres } from '../helpers/postgres.ts';
class TestStore implements ImageStore {
  kind = 'test-only-object-store';
  objects = new Map<string, Uint8Array>();
  modified = new Map<string, Date>();
  reads = 0;
  puts = 0;
  fail = false;
  corrupt = false;
  async put(key: string, bytes: Uint8Array) {
    this.puts++;
    if (this.fail) throw new StorageUnavailable();
    this.objects.set(key, bytes);
    this.modified.set(key, new Date());
  }
  async get(key: string) {
    this.reads++;
    if (this.fail || !this.objects.has(key)) throw new StorageUnavailable();
    return this.corrupt ? new Uint8Array([9]) : this.objects.get(key)!;
  }
  async delete(key: string) {
    this.objects.delete(key);
  }
  async list() {
    return {
      objects: [...this.objects.keys()].map((key) => ({
        key,
        modified: this.modified.get(key)!,
      })),
    };
  }
}
describe.each(['sqlite', 'postgres'] as const)(
  '%s private object references',
  (engine) => {
    let db: Database,
      store: TestStore,
      app: ReturnType<typeof createApp>,
      png: Buffer;
    beforeAll(async () => {
      db =
        engine === 'sqlite'
          ? asDatabase(openDatabase(':memory:'))
          : (await testPostgres()).db;
      png = await sharp({
        create: { width: 50, height: 50, channels: 3, background: '#fff' },
      })
        .png()
        .toBuffer();
    });
    afterAll(() => db.close());
    beforeEach(() => {
      store = new TestStore();
      app = createApp(db, { imageStore: store });
    });
    const call = (
      path: string,
      cookie: string,
      body?: unknown,
      method = 'POST',
    ) =>
      app.request(`http://localhost/api${path}`, {
        method,
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
          cookie,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    async function setup() {
      const r = await call('/demo', '', {}),
        d = await r.json();
      const cookie = r.headers.get('set-cookie')!.split(';')[0]!;
      const s = await call('/submissions', cookie, {
        assignmentId: d.assignment,
      });
      return { cookie, id: (await s.json()).id as string };
    }
    const upload = (d: { id: string; cookie: string }) =>
      app.request(`http://localhost/api/submissions/${d.id}/image`, {
        method: 'POST',
        headers: {
          origin: 'http://localhost',
          cookie: d.cookie,
          'content-type': 'image/png',
        },
        body: new Uint8Array(png),
      });
    it('stores normalized bytes under a private reference and authorizes each read', async () => {
      const d = await setup();
      expect((await upload(d)).status).toBe(200);
      expect(
        await db
          .prepare('SELECT 1 FROM submission_images WHERE submission_id=?')
          .get(d.id),
      ).toBeUndefined();
      const ref = await db
        .prepare(
          'SELECT object_key FROM image_references WHERE submission_id=?',
        )
        .get(d.id);
      expect(ref?.object_key).toMatch(/^tracelab-images\/v1\//);
      const response = await call(
        `/submissions/${d.id}/image`,
        d.cookie,
        undefined,
        'GET',
      );
      expect(response.status).toBe(200);
      expect(response.headers.get('cache-control')).toBe('private, no-store');
      expect(
        (await sharp(new Uint8Array(await response.arrayBuffer())).metadata())
          .format,
      ).toBe('jpeg');
      const intruder = await setup();
      const reads = store.reads,
        puts = store.puts;
      expect(
        (
          await call(
            `/submissions/${d.id}/image`,
            intruder.cookie,
            undefined,
            'GET',
          )
        ).status,
      ).toBe(404);
      expect((await upload({ ...d, cookie: intruder.cookie })).status).toBe(
        404,
      );
      expect(store.reads).toBe(reads);
      expect(store.puts).toBe(puts);
      const teacher = await call('/demo/role', d.cookie, { role: 'teacher' });
      expect(
        (
          await call(
            `/submissions/${d.id}/image`,
            teacher.headers.get('set-cookie')!.split(';')[0]!,
            undefined,
            'GET',
          )
        ).status,
      ).toBe(200);
    });
    it('preserves the previous image and reference on provider failure', async () => {
      const d = await setup();
      await upload(d);
      const previous = await db
        .prepare('SELECT * FROM image_references WHERE submission_id=?')
        .get(d.id);
      store.fail = true;
      expect((await upload(d)).status).toBe(503);
      expect(
        await db
          .prepare('SELECT * FROM image_references WHERE submission_id=?')
          .get(d.id),
      ).toEqual(previous);
      store.fail = false;
      expect(
        (await call(`/submissions/${d.id}/image`, d.cookie, undefined, 'GET'))
          .status,
      ).toBe(200);
    });
    it('never returns corrupt objects or silently substitutes a local image', async () => {
      const d = await setup();
      await upload(d);
      store.corrupt = true;
      expect(
        (await call(`/submissions/${d.id}/image`, d.cookie, undefined, 'GET'))
          .status,
      ).toBe(503);
      app = createApp(db);
      expect(
        (await call(`/submissions/${d.id}/image`, d.cookie, undefined, 'GET'))
          .status,
      ).toBe(503);
      expect((await upload(d)).status).toBe(503);
    });
    it('does not send malformed uploads or confirmed work to the provider', async () => {
      const d = await setup();
      const invalid = await app.request(
        `http://localhost/api/submissions/${d.id}/image`,
        {
          method: 'POST',
          headers: {
            origin: 'http://localhost',
            cookie: d.cookie,
            'content-type': 'image/png',
          },
          body: '<script>bad</script>',
        },
      );
      expect(invalid.status).toBe(400);
      expect(store.puts).toBe(0);
      await call(
        `/submissions/${d.id}/transcription`,
        d.cookie,
        { version: 1, lines: ['x=7'] },
        'PATCH',
      );
      await call(`/submissions/${d.id}/confirm`, d.cookie, {
        version: 2,
        confirmed: true,
      });
      expect((await upload(d)).status).toBe(409);
      expect(store.puts).toBe(0);
    });
    it('preserves the old pointer and reconciles an orphan after a database failure', async () => {
      const d = await setup();
      await upload(d);
      const previous = await db
        .prepare('SELECT * FROM image_references WHERE submission_id=?')
        .get(d.id);
      const query = async (sql: string, values: Value[]) => {
        if (sql.includes('INSERT INTO image_references'))
          throw new Error('injected reference failure');
        return db.prepare(sql).all(...values);
      };
      const failing = new Database({
        kind: engine,
        query,
        transaction: (fn, write) => db.transaction(() => fn({ query }), write),
        close: async () => {},
      });
      app = createApp(failing, { imageStore: store });
      const log = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        expect((await upload(d)).status).toBe(500);
      } finally {
        log.mockRestore();
      }
      expect(
        await db
          .prepare('SELECT * FROM image_references WHERE submission_id=?')
          .get(d.id),
      ).toEqual(previous);
      expect(store.objects.size).toBe(2);
      for (const key of store.objects.keys())
        store.modified.set(key, new Date(0));
      expect(await reconcileImages(db, store, { apply: true })).toMatchObject({
        candidates: 1,
        deleted: 1,
      });
      expect(store.objects.has(previous!.object_key as string)).toBe(true);
    });
    it('retains source bytes until migration succeeds and supports a dry-run', async () => {
      const d = await setup();
      await db
        .prepare('INSERT INTO submission_images VALUES(?,?,?)')
        .run(d.id, 'image/jpeg', new Uint8Array([1, 2, 3]));
      expect(await migrateStoredImages(db, store)).toMatchObject({
        migrated: 0,
      });
      store.fail = true;
      await expect(migrateStoredImages(db, store, true)).rejects.toThrow(
        'IMAGE_STORAGE_UNAVAILABLE',
      );
      expect(
        await db
          .prepare('SELECT bytes FROM submission_images WHERE submission_id=?')
          .get(d.id),
      ).toBeDefined();
      store.fail = false;
      expect(await migrateStoredImages(db, store, true)).toMatchObject({
        migrated: 1,
        remaining: 0,
      });
      expect(
        await db
          .prepare('SELECT 1 FROM image_references WHERE submission_id=?')
          .get(d.id),
      ).toBeDefined();
    });
    it('reconciles only old unreferenced objects and defaults to dry-run', async () => {
      const d = await setup();
      await upload(d);
      const old = [...store.objects.keys()][0]!;
      await upload(d);
      const referenced = [...store.objects.keys()][1]!;
      const fresh = `${imagePrefix}${randomUUID()}/${randomUUID()}.jpg`;
      await store.put(fresh, new Uint8Array([1]));
      store.modified.set(old, new Date(0));
      store.modified.set(referenced, new Date(0));
      expect(await reconcileImages(db, store)).toMatchObject({
        candidates: 1,
        deleted: 0,
      });
      expect(store.objects.has(old)).toBe(true);
      expect(await reconcileImages(db, store, { apply: true })).toMatchObject({
        candidates: 1,
        deleted: 1,
        more: false,
      });
      expect(store.objects.has(old)).toBe(false);
      expect(store.objects.has(referenced)).toBe(true);
      expect(store.objects.has(fresh)).toBe(true);
    });
  },
);
