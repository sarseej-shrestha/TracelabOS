import { afterEach, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  openDatabase,
  transaction,
  type DB,
} from '../../packages/database/src/local.ts';
const roots: string[] = [];
const databases: DB[] = [];
afterEach(() => {
  for (const db of databases.splice(0)) {
    try {
      db.close();
    } catch {
      /* Already closed by reopen test. */
    }
  }
  for (const root of roots.splice(0))
    rmSync(root, { recursive: true, force: true });
});
function database() {
  const root = mkdtempSync(join(tmpdir(), 'tracelab-db-test-'));
  roots.push(root);
  const path = join(root, 'demo.db'),
    db = openDatabase(path);
  databases.push(db);
  return { db, path };
}
function user(db: DB, id = 't') {
  db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(
    id,
    id,
    null,
    'teacher',
    null,
    '2026-10-08T00:00:00Z',
  );
}
it('retains records after closing and reopening the actual database file', () => {
  const { db, path } = database();
  user(db);
  db.close();
  const reopened = openDatabase(path);
  databases.push(reopened);
  expect(
    reopened.prepare('SELECT username FROM users WHERE id=?').get('t')
      ?.username,
  ).toBe('t');
  expect(
    reopened.prepare('SELECT COUNT(*) n FROM schema_migrations').get()?.n,
  ).toBe(2);
});
it('rolls back all domain changes if an event write fails', () => {
  const { db } = database();
  user(db);
  expect(() =>
    transaction(db, () => {
      db.prepare('INSERT INTO classrooms VALUES(?,?,?,?,?)').run(
        'room',
        't',
        'Classroom',
        'ABC',
        'now',
      );
      db.prepare('INSERT INTO domain_events VALUES(?,?,?,?,?,?,?)').run(
        1,
        'event',
        'missing',
        null,
        'ASSIGNMENT_PUBLISHED',
        '{}',
        'now',
      );
    }),
  ).toThrow();
  expect(db.prepare('SELECT COUNT(*) n FROM classrooms').get()?.n).toBe(0);
});
it('enforces membership foreign keys and uniqueness', () => {
  const { db } = database();
  user(db);
  expect(() =>
    db
      .prepare('INSERT INTO classroom_memberships VALUES(?,?)')
      .run('missing', 't'),
  ).toThrow();
  db.prepare('INSERT INTO classrooms VALUES(?,?,?,?,?)').run(
    'room',
    't',
    'Classroom',
    'ABC',
    'now',
  );
  db.prepare('INSERT INTO classroom_memberships VALUES(?,?)').run('room', 't');
  expect(() =>
    db
      .prepare('INSERT INTO classroom_memberships VALUES(?,?)')
      .run('room', 't'),
  ).toThrow();
});
it('treats SQL-looking values as data', () => {
  const { db } = database();
  user(db);
  const title = "Room'); DROP TABLE users; --";
  db.prepare('INSERT INTO classrooms VALUES(?,?,?,?,?)').run(
    'room',
    't',
    title,
    'ABC',
    'now',
  );
  expect(db.prepare('SELECT name FROM classrooms').get()?.name).toBe(title);
  expect(db.prepare('SELECT COUNT(*) n FROM users').get()?.n).toBe(1);
});
it('maintains a stable ordered classroom event cursor', () => {
  const { db } = database();
  user(db);
  db.prepare('INSERT INTO classrooms VALUES(?,?,?,?,?)').run(
    'room',
    't',
    'Classroom',
    'ABC',
    'now',
  );
  for (let i = 0; i < 4; i++)
    db.prepare(
      'INSERT INTO domain_events(id,classroom_id,type,payload,created_at) VALUES(?,?,?,?,?)',
    ).run(`e${i}`, 'room', 'ASSIGNMENT_PUBLISHED', '{}', 'now');
  expect(
    db
      .prepare(
        'SELECT sequence FROM domain_events WHERE classroom_id=? AND sequence>? ORDER BY sequence',
      )
      .all('room', 2)
      .map((r) => r.sequence),
  ).toEqual([3, 4]);
});
