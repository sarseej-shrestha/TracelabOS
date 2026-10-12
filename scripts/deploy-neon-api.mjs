import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { validateBackendArtifact } from './backend-release.mjs';
import { deploymentRelease } from './deployment-release.mjs';
process.env.TRACELAB_RELEASE_SHA = deploymentRelease();
validateBackendArtifact(
  JSON.parse(await readFile('.data/neon-api-bundle/release.json', 'utf8')),
  process.env.TRACELAB_RELEASE_SHA,
  createHash('sha256')
    .update(await readFile('.data/neon-api-bundle/index.mjs'))
    .digest('hex'),
);
// Load credentials with Node --env-file, or inject encrypted CI secrets. Never put them in shell text.
const keys = [
  'DATABASE_URL',
  'NEON_STORAGE_BUCKET',
  'NEON_STORAGE_ENDPOINT',
  'NEON_STORAGE_REGION',
  'NEON_STORAGE_ACCESS_KEY_ID',
  'NEON_STORAGE_SECRET_ACCESS_KEY',
  'TRACELAB_BRIDGE_SECRET',
  'TRACELAB_PUBLIC_ORIGIN',
  'TRACELAB_RELEASE_SHA',
];
for (const key of keys) if (!process.env[key]) throw Error(`Missing ${key}`);
const args = [
  'exec',
  'neonctl',
  'functions',
  'deploy',
  'tracelabapi',
  '--project-id',
  'frosty-smoke-02001105',
  '--branch',
  'br-lingering-shadow-b4ertele',
  '--src',
  '.data/neon-api-bundle',
  '--no-bundle',
  '--output',
  'json',
];
for (const key of keys) args.push('--env', `${key}=${process.env[key]}`);
const child = spawn('pnpm', args, { stdio: ['ignore', 'pipe', 'pipe'] });
let output = '';
for (const stream of [child.stdout, child.stderr])
  stream.on('data', (chunk) => {
    output += chunk.toString();
  });
child.on('error', () => {
  console.error('Could not start pinned Neon CLI');
  process.exitCode = 1;
});
child.on('close', (code) => {
  if (code !== 0) {
    for (const key of keys)
      output = output.split(process.env[key]).join('[redacted]');
    console.error(output.slice(-4000));
    process.exitCode = 1;
  } else {
    console.log(
      JSON.stringify({
        status: 'deployment-command-completed',
        function: 'tracelabapi',
        deploymentId: output.match(/"id":\s*(\d+)/)?.[1] ?? null,
        verification:
          'Run live health and browser checks before declaring success.',
      }),
    );
  }
});
