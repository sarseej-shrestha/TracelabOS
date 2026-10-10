import { prerequisiteOrder } from './prerequisites.ts';
import { skills } from '../../question-bank/src/index.ts';
import type { Evaluation } from '../../math-engine/src/index.ts';
export function recommend(
  skillId: string,
  evaluation: Evaluation,
  mastered: ReadonlySet<string> = new Set(),
) {
  const error = evaluation.steps.find((s) => s.skillId);
  const target = skills.find((s) => s.id === (error?.skillId ?? skillId));
  const prerequisite = target
    ? prerequisiteOrder(skills, target.id).find((p) => !mastered.has(p))
    : undefined;
  return {
    skillId: prerequisite ?? target?.id ?? skillId,
    algorithmVersion: 'rules-0.2.0',
    reason: evaluation.requiresReview
      ? 'Review the transcription with your teacher before updating mastery.'
      : prerequisite
        ? `Strengthen ${prerequisite} before ${target!.title.toLowerCase()}.`
        : error
          ? error.explanation
          : 'Try another variation to check that the skill transfers.',
    requiresReview: evaluation.requiresReview,
  };
}
