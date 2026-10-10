import { expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../../packages/database/src/local.ts';
it('upgrades version-four SQLite once and preserves existing classroom membership', () => {
  const directory = mkdtempSync(join(tmpdir(), 'tracelab-remediation-')),
    path = join(directory, 'local.db');
  let db = openDatabase(path);
  try {
    db.exec(
      'DROP TABLE recommendations; DELETE FROM schema_migrations WHERE version=5',
    );
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(
      't',
      'preserved-teacher',
      null,
      'teacher',
      null,
      '2026-10-10',
    );
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(
      's',
      'preserved-student',
      null,
      'student',
      null,
      '2026-10-10',
    );
    db.prepare('INSERT INTO classrooms VALUES(?,?,?,?,?)').run(
      'c',
      't',
      'Preserved classroom',
      'ABCDEF123456',
      '2026-10-10',
    );
    db.prepare('INSERT INTO classroom_memberships VALUES(?,?)').run('c', 's');
    db.close();
    db = openDatabase(path);
    expect(
      db.prepare('SELECT user_id FROM classroom_memberships').get()?.user_id,
    ).toBe('s');
    expect(db.prepare('SELECT COUNT(*) n FROM recommendations').get()?.n).toBe(
      0,
    );
    db.close();
    db = openDatabase(path);
    expect(
      db
        .prepare('SELECT COUNT(*) n FROM schema_migrations WHERE version=5')
        .get()?.n,
    ).toBe(1);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
