import { writeFileSync, mkdirSync } from 'node:fs';
import { evaluate, Rational } from '../packages/math-engine/src/index.ts';
mkdirSync('artifacts', { recursive: true });
const vectors = [];
for (let i = 0; i < 2000; i++) {
  const a = (i % 19) + 1,
    b = (i % 31) - 15,
    x = (i % 53) - 26;
  const problem = `${a}*(x+(${b}))=${a * (x + b)}`;
  const good = evaluate(problem, [`x=${x}`]),
    bad = evaluate(problem, [`x=${x + 1}`]);
  const n = (i % 37) + 1,
    d = (i % 43) + 1;
  vectors.push({
    a,
    b,
    x,
    n,
    d,
    good: good.complete,
    bad: bad.firstError === 1,
    fraction: new Rational(n, d).add(new Rational(d, n)).toString(),
  });
}
writeFileSync('artifacts/oracle-vectors.json', JSON.stringify(vectors));
