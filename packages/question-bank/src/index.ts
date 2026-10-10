import { geometrySkills, generateGeometry } from './geometry.ts';
export { geometryTemplates } from './geometry.ts';
import { ratioSkills, generateRatio } from './ratios.ts';
export { ratioTemplates } from './ratios.ts';
import { algebraSkills, generateAlgebra } from './algebra.ts';
export { algebraTemplates } from './algebra.ts';
import { Rational } from '../../math-engine/src/index.ts';
import { fractionSkills, generateFraction } from './fractions.ts';
import type { Difficulty, Question, Skill } from './types.ts';
export type { Difficulty, Question, Skill, FractionFigure } from './types.ts';
export { fractionTemplates } from './fractions.ts';
export const legacySkills = [
  {
    id: 'fraction-equivalence',
    unit: 'Fractions',
    title: 'Equivalent fractions',
    prerequisites: [],
    description:
      'Multiply or divide numerator and denominator by the same nonzero number.',
    examples: [
      ['2/4', '1/2'],
      ['6/9', '2/3'],
    ],
  },
  {
    id: 'fraction-addition',
    unit: 'Fractions',
    title: 'Add unlike fractions',
    prerequisites: ['fraction-equivalence'],
    description: 'Express equal-sized parts before adding their numerators.',
    examples: [
      ['1/2 + 1/3', '3/6 + 2/6', '5/6'],
      ['1/4 + 1/2', '1/4 + 2/4', '3/4'],
    ],
  },
  {
    id: 'one-step-equations',
    unit: 'Linear equations',
    title: 'Balance an equation',
    prerequisites: [],
    description:
      'Apply the same reversible operation to both sides to isolate x.',
    examples: [
      ['x + 3 = 8', 'x = 5'],
      ['4x = 12', 'x = 3'],
    ],
  },
  {
    id: 'distributive-property',
    unit: 'Linear equations',
    title: 'Distribute to every term',
    prerequisites: ['one-step-equations'],
    description:
      'Multiply every term inside the parentheses by the outside factor.',
    examples: [
      ['3(x - 2) = 15', '3x - 6 = 15', '3x = 21', 'x = 7'],
      ['2(x + 4) = 18', '2x + 8 = 18', '2x = 10', 'x = 5'],
    ],
  },
] as const;
export const skills: readonly Skill[] = [
  ...fractionSkills,
  ...algebraSkills,
  ...ratioSkills,
  ...geometrySkills,
];
export function generateQuestion(
  skillId: string,
  seed: number,
  difficulty: Difficulty = 'practice',
): Question {
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647)
    throw new Error('Invalid seed');
  if (!['intro', 'practice', 'challenge'].includes(difficulty))
    throw new Error('Invalid difficulty');
  return fractionSkills.some((s) => s.id === skillId)
    ? generateFraction(skillId, seed, difficulty)
    : algebraSkills.some((s) => s.id === skillId)
      ? generateAlgebra(skillId, seed, difficulty)
      : ratioSkills.some((s) => s.id === skillId)
        ? generateRatio(skillId, seed, difficulty)
        : generateGeometry(skillId, seed, difficulty);
}
export function generateLegacyQuestion(
  skillId: string,
  seed: number,
  difficulty: Difficulty = 'practice',
): Question {
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647)
    throw new Error('Invalid seed');
  if (!['intro', 'practice', 'challenge'].includes(difficulty))
    throw new Error('Invalid difficulty');
  let state = seed >>> 0;
  const rand = (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return 1 + (state % max);
  };
  const range = difficulty === 'intro' ? 4 : difficulty === 'practice' ? 8 : 15;
  const a = rand(range) + 1,
    b = rand(range),
    x = rand(range) + b;
  let expression: string, reference: string[], prompt: string;
  if (skillId === 'distributive-property') {
    expression = `${a}(x - ${b}) = ${a * (x - b)}`;
    reference = [
      expression,
      `${a}x - ${a * b} = ${a * (x - b)}`,
      `${a}x = ${a * x}`,
      `x = ${x}`,
    ];
    prompt =
      'Solve for x. Show how you distribute and keep the equation balanced.';
  } else if (skillId === 'one-step-equations') {
    expression = `x + ${b} = ${x + b}`;
    reference = [expression, `x = ${x}`];
    prompt = 'Find x using the same operation on both sides.';
  } else if (skillId === 'fraction-addition') {
    expression = `1/${a} + 1/${b + 1}`;
    reference = [
      expression,
      `${b + 1}/${a * (b + 1)} + ${a}/${a * (b + 1)}`,
      new Rational(a + b + 1, a * (b + 1)).toString(),
    ];
    prompt = 'Add the fractions. Show the common denominator.';
  } else if (skillId === 'fraction-equivalence') {
    expression = `${a * b}/${a * (b + 1)}`;
    reference = [expression, new Rational(b, b + 1).toString()];
    prompt = 'Simplify this fraction without changing its value.';
  } else throw new Error('Unsupported skill');
  return {
    id: `${skillId}-${difficulty}-${seed}`,
    templateId: `${skillId}-v1`,
    templateVersion: '1.0.0',
    skillId,
    seed,
    difficulty,
    expression,
    reference,
    prompt,
    parameters: { a, b, x },
  };
}
export const demoQuestion: Question = {
  id: 'distribution-demo-v1',
  templateId: 'distribution-demo',
  templateVersion: '1.0.0',
  skillId: 'distributive-property',
  seed: 0,
  difficulty: 'practice',
  prompt:
    'Solve for x. Show how you distribute and keep the equation balanced.',
  expression: '3(x - 2) = 15',
  reference: ['3(x - 2) = 15', '3x - 6 = 15', '3x = 21', 'x = 7'],
  parameters: { a: 3, b: 2, x: 7 },
};
