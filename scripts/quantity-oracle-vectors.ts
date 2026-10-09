import { writeFileSync } from 'node:fs';
import {
  parseQuantity,
  type LengthUnit,
} from '../packages/math-engine/src/quantities.ts';
const units: LengthUnit[] = ['mm', 'cm', 'm'];
const cases = [];
let state = 20261009;
const rand = () => {
  state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
  return 1 + (state % 500);
};
for (let seed = 0; seed < 500; seed++) {
  const a = rand(),
    b = rand(),
    unitA = units[seed % 3]!,
    unitB = units[Math.floor(seed / 3) % 3]!;
  for (const operation of [
    'product',
    'quotient',
    'sum',
    'perimeter',
  ] as const) {
    const expression =
      operation === 'product'
        ? `${a}${unitA}*${b}${unitB}`
        : operation === 'quotient'
          ? `${a}${unitA}/(${b}${unitB})`
          : operation === 'sum'
            ? `${a}${unitA}+${b}${unitB}`
            : `2*(${a}${unitA}+${b}${unitB})`;
    const q = parseQuantity(expression);
    cases.push({
      seed,
      a,
      b,
      unitA,
      unitB,
      operation,
      expression,
      value: q.value.toString(),
      power: q.power,
    });
  }
}
writeFileSync('artifacts/quantity-oracle-vectors.json', JSON.stringify(cases));
