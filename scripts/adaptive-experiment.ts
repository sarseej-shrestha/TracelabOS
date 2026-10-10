import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { skills } from '../packages/question-bank/src/index.ts';
import {
  BKT_PARAMETERS,
  MASTERY_VERSION,
} from '../packages/learning-engine/src/mastery.ts';
import {
  EXPERIMENT_VERSION,
  predictionPath,
  practiceChoices,
} from '../research/adaptive-evaluation/strategies.ts';
const directory = '.data/adaptive-evaluation';
mkdirSync(directory, { recursive: true });
if (process.argv[2] === 'catalog') {
  writeFileSync(
    `${directory}/catalog.json`,
    JSON.stringify(
      skills.map(({ id, prerequisites }) => ({ id, prerequisites })),
    ) + '\n',
  );
} else if (process.argv[2] === 'score') {
  const source = readFileSync(`${directory}/trajectories.json`, 'utf8');
  type Learner = {
    id: string;
    split: 'train' | 'test';
    skills: { skillId: string; observations: boolean[] }[];
  };
  const data = JSON.parse(source) as {
    scenarios: { name: string; learners: Learner[] }[];
  };
  const scenarios = data.scenarios.map((scenario) => {
    const training = scenario.learners
      .filter((learner) => learner.split === 'train')
      .flatMap((learner) =>
        learner.skills.flatMap((skill) => skill.observations),
      );
    const baseline =
      (training.filter(Boolean).length + 1) / (training.length + 2);
    return {
      name: scenario.name,
      trainingBaseline: baseline,
      learners: scenario.learners
        .filter((learner) => learner.split === 'test')
        .map((learner) => {
          const histories = Object.fromEntries(
            learner.skills.map((skill) => [skill.skillId, skill.observations]),
          );
          return {
            id: learner.id,
            predictions: learner.skills.flatMap((skill) =>
              predictionPath(skill.observations, baseline),
            ),
            choices: skills.map((skill) => ({
              target: skill.id,
              ...practiceChoices(skill.id, histories),
            })),
          };
        }),
    };
  });
  const report = {
    experimentVersion: EXPERIMENT_VERSION,
    algorithmVersion: MASTERY_VERSION,
    parameters: BKT_PARAMETERS,
    datasetSha256: createHash('sha256').update(source).digest('hex'),
    scenarios,
  };
  writeFileSync(`${directory}/predictions.json`, JSON.stringify(report) + '\n');
  console.log(
    JSON.stringify({
      experimentVersion: EXPERIMENT_VERSION,
      scenarios: scenarios.length,
      testLearners: scenarios.reduce((n, s) => n + s.learners.length, 0),
    }),
  );
} else throw new Error('Usage: adaptive-experiment.ts catalog|score');
