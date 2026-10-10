import type {
  Question,
  StudentQuestion,
} from '../../../packages/question-bank/src/types.ts';
/** Deliberate allowlist: new internal snapshot fields are private by default. */
export function studentQuestion(question: Question): StudentQuestion {
  return {
    id: question.id,
    skillId: question.skillId,
    difficulty: question.difficulty,
    prompt: question.prompt,
    expression: question.expression,
    explanation: question.explanation,
    figure: question.figure,
    answerForm: question.answerForm,
    answerUnit: question.answerUnit,
    reasoningDomain: question.reasoningDomain,
  };
}
