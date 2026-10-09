import { writeFileSync } from 'node:fs';
import { ratioSkills } from '../packages/question-bank/src/ratios.ts';
import { generateQuestion } from '../packages/question-bank/src/index.ts';
import { evaluateQuestion } from '../packages/question-bank/src/grading.ts';
const cases = [];
for (const skill of ratioSkills)
  for (const difficulty of ['intro', 'practice', 'challenge'] as const)
    for (let seed = 0; seed < 100; seed++) {
      const q = generateQuestion(skill.id, seed, difficulty);
      cases.push({
        skillId: q.skillId,
        templateId: q.templateId,
        seed,
        difficulty,
        parameters: q.parameters,
        expression: q.expression,
        paths: [q.reference, ...q.alternativePaths!],
        typescriptComplete: [q.reference, ...q.alternativePaths!].map(
          (path) => evaluateQuestion(q, path).complete,
        ),
      });
    }
writeFileSync('artifacts/ratio-oracle-vectors.json', JSON.stringify(cases));
