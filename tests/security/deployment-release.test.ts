import { expect, it } from 'vitest';
import { validateDeploymentSource } from '../../scripts/deployment-release.mjs';
const sha = 'a'.repeat(40);
it('accepts a clean exact commit and newly generated browser evidence', () => {
  expect(validateDeploymentSource(sha, sha, '')).toBe(sha);
  expect(
    validateDeploymentSource(
      sha,
      sha,
      ' M artifacts/browser-results.json\0 M artifacts/teacher-studio.png\0',
    ),
  ).toBe(sha);
});
it.each(['', 'main', 'b'.repeat(40), 'a'.repeat(39), 'a'.repeat(40) + '\n'])(
  'rejects mismatched or malformed release identity %#',
  (expected) => {
    expect(() => validateDeploymentSource(sha, expected, '')).toThrow('match');
  },
);
it.each([
  ' M services/api/src/app.ts\0',
  '?? scripts/unreviewed.mjs\0',
  ' M artifacts/adaptive-strategy-results.json\0',
  ' M pnpm-lock.yaml\0',
  'R  artifacts/teacher-studio.png\0services/api/src/app.ts\0',
])(
  'rejects uncommitted code, dependencies, application data and renamed source %#',
  (status) => {
    expect(() => validateDeploymentSource(sha, sha, status)).toThrow('Commit');
  },
);

import { openDatabase } from '../../packages/database/src/local.ts';
import { createApp } from '../../services/api/src/app.ts';
it.each([sha, undefined, '<untrusted>'])(
  'reports only valid backend release metadata %#',
  async (releaseSha) => {
    const db = openDatabase(':memory:');
    try {
      const response = await createApp(db, { releaseSha }).request(
        'http://localhost/api/health',
      );
      expect(response.status).toBe(200);
      expect((await response.json()).release).toBe(
        releaseSha === sha ? sha : null,
      );
    } finally {
      db.close();
    }
  },
);
