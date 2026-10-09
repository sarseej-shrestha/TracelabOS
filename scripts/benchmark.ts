import { performance } from 'node:perf_hooks';
import { writeFileSync, mkdirSync } from 'node:fs';
import { cpus } from 'node:os';
import { evaluate } from '../packages/math-engine/src/index.ts';
const problem = '3(x-2)=15',
  lines = ['3(x-2)=15', '3x-2=15', '3x=17', 'x=17/3'];
for (let i = 0; i < 500; i++) evaluate(problem, lines);
const samples: number[] = [];
for (let i = 0; i < 10000; i++) {
  const start = performance.now();
  evaluate(problem, lines);
  samples.push(performance.now() - start);
}
samples.sort((a, b) => a - b);
const result = {
  timestamp: new Date().toISOString(),
  node: process.version,
  cpu: cpus()[0]?.model,
  engine: '0.1.0',
  method:
    'single process; 500 warmups; 10000 runs of one 4-step distribution case; no network or database',
  iterations: samples.length,
  p50_ms: samples[Math.floor(samples.length * 0.5)],
  p95_ms: samples[Math.floor(samples.length * 0.95)],
  p99_ms: samples[Math.floor(samples.length * 0.99)],
};
mkdirSync('artifacts', { recursive: true });
writeFileSync(
  'artifacts/math-benchmark.json',
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));
