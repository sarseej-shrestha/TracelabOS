import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const expected = process.env.TRACELAB_RELEASE_SHA;
assert.match(expected ?? '', /^[a-f0-9]{40}$/);
const response = await fetch(
  'https://tracelabos.sarseej-shrestha.workers.dev/api/health',
  {
    signal: AbortSignal.timeout(30000),
    redirect: 'error',
  },
);
assert.equal(response.status, 200);
const health = await response.json();
assert.equal(health.release, expected, 'Neon API must run the selected commit');
assert.equal(
  response.headers.get('x-tracelab-worker-release'),
  expected,
  'Worker must run the selected commit',
);
assert.equal(health.persistence, 'neon-postgresql');
assert.equal(health.imageStorage, 'private-neon');
const evidence = {
  measuredAt: new Date().toISOString(),
  release: expected,
  worker: 'tracelabos',
  health,
  bothCommitsVerified: true,
};
await writeFile(
  'artifacts/cloud-release-smoke.json',
  JSON.stringify(evidence, null, 2) + '\n',
);
console.log(JSON.stringify(evidence));
