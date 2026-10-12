import { build } from 'esbuild';
import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { backendBuildIdentity } from './backend-release.mjs';
import { execFileSync } from 'node:child_process';
const directory = '.data/neon-api-bundle';
const release = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
}).trim();
const sourceStatus = execFileSync('git', ['status', '--porcelain=v1', '-z'], {
  encoding: 'utf8',
});
await rm(directory, { recursive: true, force: true });
await mkdir(directory, { recursive: true });
await build({
  entryPoints: ['services/api/src/neon-function.ts'],
  outfile: `${directory}/index.mjs`,
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  external: ['sharp'],
  define: { 'process.env.TRACELAB_BUILD_SHA': JSON.stringify(release) },
  banner: {
    js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
  },
});
for (const file of ['package.json', 'package-lock.json'])
  await copyFile(`services/api/deployment/${file}`, `${directory}/${file}`);
// The measured Neon runtime is Linux arm64; --force permits installing its pinned binaries on macOS.
// Node Functions run Linux; package native image dependencies instead of bundling their loader.
execFileSync(
  'npm',
  [
    'ci',
    '--prefix',
    directory,
    '--force',
    '--omit=optional',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
  ],
  { stdio: 'inherit' },
);
const digest = createHash('sha256')
  .update(await readFile(`${directory}/index.mjs`))
  .digest('hex');
await writeFile(
  `${directory}/release.json`,
  JSON.stringify(backendBuildIdentity(release, sourceStatus, digest)),
);
console.log(
  'Neon Node.js API bundle created with source identity; no environment files included.',
);
