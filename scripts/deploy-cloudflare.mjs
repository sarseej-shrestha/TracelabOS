import { mkdir, writeFile, unlink } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { deploymentRelease } from './deployment-release.mjs';
const release = deploymentRelease();
const secret = process.env.TRACELAB_BRIDGE_SECRET;
if (!/^[a-f0-9]{64}$/.test(secret ?? ''))
  throw Error('Load TRACELAB_BRIDGE_SECRET securely before deploying');
await mkdir('.data', { recursive: true });
const file = '.data/cloudflare-deploy-secrets.json';
await writeFile(file, JSON.stringify({ TRACELAB_BRIDGE_SECRET: secret }), {
  mode: 0o600,
  flag: 'wx',
});
try {
  execFileSync(
    'pnpm',
    [
      'exec',
      'wrangler',
      'deploy',
      '--config',
      'apps/web/wrangler.jsonc',
      '--secrets-file',
      file,
      '--var',
      `TRACELAB_RELEASE_SHA:${release}`,
    ],
    { stdio: 'inherit' },
  );
} finally {
  await unlink(file);
}
