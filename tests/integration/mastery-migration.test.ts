import { expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase } from '../../packages/database/src/local.ts';
it('upgrades a version-three local database once without losing existing users', () => {
  const directory = mkdtempSync(join(tmpdir(), 'tracelab-mastery-'));
  const path = join(directory, 'local.db');
  let db = openDatabase(path);
  try {
    db.exec(
      'DROP TABLE recommendations; DROP TABLE mastery_estimates; DROP TABLE mastery_evidence; DROP TABLE skill_prerequisites; DROP TABLE skills; DELETE FROM schema_migrations WHERE version>=4',
    );
    db.prepare('INSERT INTO users VALUES(?,?,?,?,?,?)').run(
      'preserved',
      'existing',
      null,
      'student',
      null,
      '2026-10-09T00:00:00Z',
    );
    db.close();
    db = openDatabase(path);
    expect(
      db.prepare('SELECT username FROM users WHERE id=?').get('preserved')
        ?.username,
    ).toBe('existing');
    expect(db.prepare('SELECT COUNT(*) n FROM skills').get()?.n).toBe(24);
    db.close();
    db = openDatabase(path);
    expect(db.prepare('SELECT COUNT(*) n FROM skills').get()?.n).toBe(24);
    expect(
      db
        .prepare('SELECT COUNT(*) n FROM schema_migrations WHERE version=4')
        .get()?.n,
    ).toBe(1);
  } finally {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
