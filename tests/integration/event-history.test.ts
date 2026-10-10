import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { openDatabase } from '../../packages/database/src/local.ts';
import {
  asDatabase,
  type Database,
} from '../../packages/database/src/adapter.ts';
import { createApp } from '../../services/api/src/app.ts';
import { testPostgres } from '../helpers/postgres.ts';
import {
  loadHistory,
  type HistoryPage,
} from '../../services/realtime/src/history.ts';
import { replayClassroom } from '../../services/realtime/src/replay.ts';

describe.each(['sqlite', 'postgres'] as const)(
  '%s classroom event snapshots',
  (engine) => {
    let db: Database, app: ReturnType<typeof createApp>;
    beforeAll(async () => {
      db =
        engine === 'sqlite'
          ? asDatabase(openDatabase(':memory:'))
          : (await testPostgres()).db;
    });
    afterAll(() => db.close());
    beforeEach(() => {
      app = createApp(db);
    });
    const call = (path: string, cookie = '', body?: unknown) =>
      app.request(`http://localhost/api${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          origin: 'http://localhost',
          'content-type': 'application/json',
          cookie,
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    const session = (response: Response) =>
      response.headers.get('set-cookie')!.split(';')[0]!;
    async function setup() {
      const response = await call('/demo', '', {});
      const { room } = await response.json();
      const student = session(response);
      expect(
        (await call(`/classrooms/${room}/event-history`, student)).status,
      ).toBe(404);
      const teacher = session(
        await call('/demo/role', student, { role: 'teacher' }),
      );
      return { room: room as string, teacher };
    }
    async function append(
      room: string,
      assignment = randomUUID(),
      extra: object = {},
    ) {
      const id = randomUUID();
      await db
        .prepare(
          'INSERT INTO domain_events(id,classroom_id,submission_id,type,payload,created_at) VALUES(?,?,?,?,?,?)',
        )
        .run(
          id,
          room,
          null,
          'ASSIGNMENT_PUBLISHED',
          JSON.stringify({ assignmentId: assignment, ...extra }),
          '2026-10-10T00:00:00.000Z',
        );
      return id;
    }
    it('loads more than 100 events with a fixed snapshot despite interleaving other classrooms and new events', async () => {
      const own = await setup(),
        other = await setup();
      await db.transaction(async () => {
        for (let i = 0; i < 104; i++) {
          await append(own.room);
          if (i % 10 === 0) await append(other.room);
        }
      });
      let reads = 0,
        appended: string | undefined;
      const captured = await loadHistory(async (after, through) => {
        const response = await call(
          `/classrooms/${own.room}/event-history?after=${after}${through === undefined ? '' : `&through=${through}`}`,
          own.teacher,
        );
        expect(response.status).toBe(200);
        const page = (await response.json()) as HistoryPage;
        if (++reads === 1) {
          expect(page.events).toHaveLength(100);
          expect(page.hasMore).toBe(true);
          appended = await append(own.room);
        }
        return page;
      });
      expect(reads).toBe(2);
      expect(captured.events).toHaveLength(105);
      expect(captured.events.some((event) => event.id === appended)).toBe(
        false,
      );
      const replay = replayClassroom(captured.events);
      expect(replay.assignments).toHaveLength(105);
      expect(replay.warnings).toEqual([]);
      const refreshed = await call(
        `/classrooms/${own.room}/event-history`,
        own.teacher,
      );
      expect((await refreshed.json()).total).toBe(106);
    });
    it('denies anonymous, student and unrelated teachers before exposing cursor metadata', async () => {
      const own = await setup(),
        other = await setup();
      expect((await call(`/classrooms/${own.room}/event-history`)).status).toBe(
        401,
      );
      expect(
        (
          await call(
            `/classrooms/${own.room}/event-history?after=invalid`,
            other.teacher,
          )
        ).status,
      ).toBe(404);
      expect(
        (await call(`/classrooms/${randomUUID()}/event-history`, own.teacher))
          .status,
      ).toBe(404);
    });
    it('projects only bounded metadata and preserves original event bytes', async () => {
      const own = await setup();
      const eventId = await append(own.room, randomUUID(), {
        photo: 'private-image',
        lines: ['private-transcription'],
        studentName: 'private-name',
        futureField: 'private-future',
        code: 'x'.repeat(101),
      });
      const response = await call(
        `/classrooms/${own.room}/event-history`,
        own.teacher,
      );
      const body = (await response.json()) as HistoryPage;
      expect(
        Object.keys(body.events.find((event) => event.id === eventId)!.payload),
      ).toEqual(['assignmentId']);
      expect(JSON.stringify(body)).not.toContain('private-');
      const original = await db
        .prepare('SELECT payload FROM domain_events WHERE id=?')
        .get(eventId);
      expect(original!.payload).toContain('private-transcription');
    });
    it.each([
      'after=-1',
      'after=1.5',
      'after=NaN',
      'after=9007199254740992',
      'through=9007199254740991',
      'after=1&through=0',
    ])('rejects invalid cursor %s', async (query) => {
      const own = await setup();
      expect(
        (
          await call(
            `/classrooms/${own.room}/event-history?${query}`,
            own.teacher,
          )
        ).status,
      ).toBe(400);
    });
    it('returns an empty initial snapshot for a classroom without events', async () => {
      const own = await setup();
      const created = await call('/classrooms', own.teacher, {
        name: 'Empty history',
      });
      expect(created.status).toBe(201);
      const { id } = await created.json();
      const response = await call(
        `/classrooms/${id}/event-history`,
        own.teacher,
      );
      expect(await response.json()).toEqual({
        events: [],
        through: 0,
        total: 0,
        nextCursor: 0,
        hasMore: false,
      });
    });
    it('refuses oversized history instead of silently truncating it', async () => {
      const own = await setup();
      await db.transaction(async () => {
        for (let i = 0; i < 10000; i++) await append(own.room);
      });
      const response = await call(
        `/classrooms/${own.room}/event-history`,
        own.teacher,
      );
      expect(response.status).toBe(409);
      expect((await response.json()).error).toBe('HISTORY_LIMIT_EXCEEDED');
    }, 30000);
  },
);
