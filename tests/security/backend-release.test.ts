import { expect, it } from 'vitest';
import {
  backendBuildIdentity,
  validateBackendArtifact,
} from '../../scripts/backend-release.mjs';
import { backendRelease } from '../../services/api/src/backend-release.ts';
const sha = 'a'.repeat(40),
  digest = 'b'.repeat(64);
it('ties a clean artifact to both its source commit and actual entry bytes', () => {
  const manifest = backendBuildIdentity(sha, '', digest);
  expect(validateBackendArtifact(manifest, sha, digest)).toBe(sha);
  expect(() =>
    validateBackendArtifact(manifest, 'c'.repeat(40), digest),
  ).toThrow('Rebuild');
  expect(() => validateBackendArtifact(manifest, sha, 'd'.repeat(64))).toThrow(
    'Rebuild',
  );
});
it('allows development builds but refuses their publication after uncommitted edits', () => {
  const manifest = backendBuildIdentity(
    sha,
    ' M services/api/src/app.ts\0',
    digest,
  );
  expect(manifest.sourceClean).toBe(false);
  expect(() => validateBackendArtifact(manifest, sha, digest)).toThrow(
    'Rebuild',
  );
});
it('generated browser reports do not make checked code dirty', () => {
  const manifest = backendBuildIdentity(
    sha,
    ' M artifacts/cloud-browser-results.json\0 D artifacts/cloud-release-smoke.json\0',
    digest,
  );
  expect(validateBackendArtifact(manifest, sha, digest)).toBe(sha);
});
it.each([
  undefined,
  null,
  {},
  'manifest',
  { release: sha, entrySha256: digest, sourceClean: 'true' },
  { release: sha, sourceClean: true },
  { entrySha256: digest, sourceClean: true },
])('rejects absent or invalid artifact provenance %#', (manifest) =>
  expect(() => validateBackendArtifact(manifest, sha, digest)).toThrow(
    'Rebuild',
  ),
);
it.each(['', 'main', 'a'.repeat(39), 'a'.repeat(40) + '\n'])(
  'rejects noncommit source labels %#',
  (release) =>
    expect(() => backendBuildIdentity(release, '', digest)).toThrow('identity'),
);
it.each(['', 'digest', 'b'.repeat(63)])(
  'rejects non-digest artifacts %#',
  (hash) =>
    expect(() => backendBuildIdentity(sha, '', hash)).toThrow('identity'),
);
it('returns the compiled revision only when runtime configuration agrees', () =>
  expect(backendRelease(sha, sha)).toBe(sha));
it.each([
  [sha, 'c'.repeat(40)],
  [sha, undefined],
  [undefined, sha],
  [undefined, undefined],
  ['main', 'main'],
  ['', ''],
])(
  'fails closed for stale, missing or invalid runtime metadata %#',
  (built, configured) =>
    expect(backendRelease(built, configured)).toBeUndefined(),
);
