import { writeFileSync } from 'node:fs';
import { geometrySkills } from '../packages/question-bank/src/geometry.ts';
import { generateQuestion } from '../packages/question-bank/src/index.ts';
import { evaluateQuestion } from '../packages/question-bank/src/grading.ts';
const cases = [];
for (const skill of geometrySkills)
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
        answerUnit: q.answerUnit,
        paths: [q.reference, ...q.alternativePaths!],
        typescriptComplete: [q.reference, ...q.alternativePaths!].map(
          (path) => evaluateQuestion(q, path).complete,
        ),
      });
    }
writeFileSync('artifacts/geometry-oracle-vectors.json', JSON.stringify(cases));
