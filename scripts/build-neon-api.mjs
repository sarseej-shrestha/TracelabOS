import { build } from 'esbuild';
import { mkdir, copyFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const directory = '.data/neon-api-bundle';
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
console.log('Neon Node.js API bundle created; no environment files included.');
