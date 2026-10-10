import {
  BKT_PARAMETERS,
  estimateMastery,
  updateKnowledge,
} from '../../packages/learning-engine/src/mastery.ts';
import { unmetPrerequisite } from '../../packages/learning-engine/src/prerequisites.ts';
import { skills } from '../../packages/question-bank/src/index.ts';
export const EXPERIMENT_VERSION = 'synthetic-adaptive-1';
/** Every prediction precedes its observed outcome; fixed baseline is fitted only on training learners. */
export function predictionPath(
  observations: readonly boolean[],
  constant: number,
) {
  if (!Number.isFinite(constant) || constant <= 0 || constant >= 1)
    throw new Error('INVALID_BASELINE');
  let knowledge = BKT_PARAMETERS.prior,
    correct = 0;
  return observations.map((outcome, index) => {
    const predictions = {
      constant,
      frequency: (correct + 1) / (index + 2),
      bkt:
        knowledge * (1 - BKT_PARAMETERS.slip) +
        (1 - knowledge) * BKT_PARAMETERS.guess,
    };
    knowledge = updateKnowledge(knowledge, outcome);
    if (outcome) correct++;
    return { outcome, predictions };
  });
}
/** This experiment sees past reviewed outcomes only, never the simulator's latent state. */
export function practiceChoices(
  target: string,
  histories: Readonly<Record<string, readonly boolean[]>>,
) {
  const rules = new Set<string>(),
    bkt = new Set<string>();
  for (const skill of skills) {
    const history = histories[skill.id] ?? [];
    if (history.length >= 3 && history.slice(-3).every(Boolean))
      rules.add(skill.id);
    if (estimateMastery(history).status === 'ready_to_practice_further')
      bkt.add(skill.id);
  }
  return {
    baseline: target,
    rules: unmetPrerequisite(skills, target, rules) ?? target,
    bkt: unmetPrerequisite(skills, target, bkt) ?? target,
  };
}
