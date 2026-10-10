import { writeFileSync } from 'node:fs';
import {
  BKT_PARAMETERS,
  estimateMastery,
  MASTERY_VERSION,
} from '../packages/learning-engine/src/mastery.ts';
const cases = [];
for (let length = 0; length <= 10; length++) {
  for (let mask = 0; mask < 2 ** length; mask++) {
    const observations = Array.from({ length }, (_, i) =>
      Boolean(mask & (1 << i)),
    );
    cases.push({ observations, ...estimateMastery(observations) });
  }
}
writeFileSync(
  'artifacts/mastery-oracle-vectors.json',
  JSON.stringify(
    { algorithmVersion: MASTERY_VERSION, parameters: BKT_PARAMETERS, cases },
    null,
    2,
  ) + '\n',
);
console.log(`${cases.length} exhaustive binary sequences written`);
