import { expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase } from '../../packages/database/src/local.ts';
it('requires an explicit existing database and defaults to a read-only inspection', () => {
  const directory = mkdtempSync(join(tmpdir(), 'tracelab-rebuild-cli-')),
    path = join(directory, 'source.db');
  const env = { ...process.env, DATABASE_URL: '', TRACELAB_DB_PATH: path };
  const run = (args: string[] = [], variables = env) =>
    spawnSync(
      process.execPath,
      ['--experimental-transform-types', 'scripts/mastery-rebuild.ts', ...args],
      { env: variables, encoding: 'utf8' },
    );
  try {
    expect(run().status).not.toBe(0);
    expect(existsSync(path)).toBe(false);
    const db = openDatabase(path);
    db.close();
    const before = readFileSync(path);
    const report = run();
    expect(report.status).toBe(0);
    expect(JSON.parse(report.stdout)).toMatchObject({
      mode: 'dry-run',
      applied: false,
      reviewedSubmissions: 0,
    });
    expect(readFileSync(path)).toEqual(before);
    expect(JSON.parse(run(['--apply']).stdout)).toMatchObject({
      mode: 'apply',
      applied: false,
    });
    expect(run(['--unknown']).status).not.toBe(0);
    expect(run([], { ...env, TRACELAB_DB_PATH: '' }).status).not.toBe(0);
    expect(
      run([], {
        ...env,
        DATABASE_URL: 'postgresql://fixture:fixture@unused.neon.tech/demo',
      }).status,
    ).not.toBe(0);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
