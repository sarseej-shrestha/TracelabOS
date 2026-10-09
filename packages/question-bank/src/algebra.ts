import { Rational } from '../../math-engine/src/index.ts';
import type { Difficulty, Question, Skill } from './types.ts';
export const algebraSkills: readonly Skill[] = [
  {
    id: 'arithmetic-expressions',
    unit: 'Linear equations',
    title: 'Evaluate arithmetic expressions',
    prerequisites: [],
    description:
      'Evaluate grouped operations first, then multiplication or division, then addition or subtraction. Grouping can change the value.',
    examples: [
      ['3+4*2', '3+8', '11'],
      ['(3+4)*2', '7*2', '14'],
    ],
    standards: ['5.OA.A.1'],
    misconceptions: [
      'Adding before multiplication without parentheses',
      'Ignoring grouping',
    ],
    remediationSkillId: 'arithmetic-expressions',
  },
  {
    id: 'combine-like-terms',
    unit: 'Linear equations',
    title: 'Combine like terms',
    prerequisites: ['arithmetic-expressions'],
    description:
      'Add or subtract the coefficients of x terms, and combine constants separately. The value must stay the same for every x.',
    examples: [
      ['3x+2x+4', '5x+4'],
      ['6x-2x+5-3', '4x+2'],
    ],
    standards: ['6.EE.A.3', '6.EE.A.4', '7.EE.A.1'],
    misconceptions: [
      'Combining x terms with constants',
      'Changing a subtraction sign',
    ],
    remediationSkillId: 'arithmetic-expressions',
  },
  {
    id: 'one-step-equations',
    unit: 'Linear equations',
    title: 'Balance an equation',
    prerequisites: ['arithmetic-expressions'],
    description:
      'Use the inverse operation on both sides of an equation. Division is allowed only by a known nonzero quantity.',
    examples: [
      ['x+3=8', 'x=5'],
      ['4x=7', 'x=7/4'],
    ],
    standards: ['6.EE.B.7'],
    misconceptions: [
      'Changing only one side',
      'Multiplying instead of dividing to isolate x',
    ],
    remediationSkillId: 'arithmetic-expressions',
  },
  {
    id: 'distributive-property',
    unit: 'Linear equations',
    title: 'Distribute to every term',
    prerequisites: ['combine-like-terms', 'one-step-equations'],
    description:
      'Multiply every term inside parentheses by the outside factor. Preserve signs, then combine terms or solve the resulting equation.',
    examples: [
      ['3(x-2)', '3x-6'],
      ['2(x+4)=18', '2x+8=18', '2x=10', 'x=5'],
    ],
    standards: ['6.EE.A.3', '7.EE.B.4a'],
    misconceptions: [
      'Multiplying only the first term',
      'Losing the sign of a constant',
    ],
    remediationSkillId: 'combine-like-terms',
  },
  {
    id: 'two-step-equations',
    unit: 'Linear equations',
    title: 'Solve two-step equations',
    prerequisites: ['one-step-equations'],
    description:
      'Undo addition or subtraction and then a nonzero multiplication or division. An alternative order is valid when the operation applies to the whole side.',
    examples: [
      ['3x+4=19', '3x=15', 'x=5'],
      ['x/3+2=6', 'x/3=4', 'x=12'],
    ],
    standards: ['7.EE.B.4a'],
    misconceptions: [
      'Dividing only one term on a side',
      'Using the wrong inverse operation',
    ],
    remediationSkillId: 'one-step-equations',
  },
  {
    id: 'variables-both-sides',
    unit: 'Linear equations',
    title: 'Variables on both sides',
    prerequisites: ['two-step-equations', 'distributive-property'],
    description:
      'Use equal operations to collect variable terms on one side and constants on the other. These templates have one unique solution; identities and contradictions require review.',
    examples: [
      ['5x+2=2x+11', '3x=9', 'x=3'],
      ['3(x+2)=x+14', '3x+6=x+14', '2x=8', 'x=4'],
    ],
    standards: ['8.EE.C.7b'],
    misconceptions: [
      'Moving a term without changing the corresponding operation',
      'Distributing to only one term',
    ],
    remediationSkillId: 'two-step-equations',
  },
];
export const algebraTemplates = [
  ['arithmetic-expressions', 'operation-order'],
  ['arithmetic-expressions', 'grouped-sum'],
  ['combine-like-terms', 'collect-sums'],
  ['combine-like-terms', 'collect-differences'],
  ['one-step-equations', 'addition'],
  ['one-step-equations', 'multiplication'],
  ['distributive-property', 'expand-expression'],
  ['distributive-property', 'expand-and-solve'],
  ['two-step-equations', 'multiply-then-add'],
  ['two-step-equations', 'divide-then-add'],
  ['variables-both-sides', 'collect-variables'],
  ['variables-both-sides', 'distribute-and-collect'],
].map(([skillId, name]) => ({
  id: `${skillId}-${name}-v2`,
  skillId: skillId!,
  name: name!,
  version: '2.0.0',
}));
const affine = (a: number, b: number) =>
  a === 0
    ? `${b}`
    : `${a === 1 ? '' : a === -1 ? '-' : a}x${b === 0 ? '' : b < 0 ? `${b}` : `+${b}`}`;
export function generateAlgebra(
  skillId: string,
  seed: number,
  difficulty: Difficulty,
): Question {
  const skill = algebraSkills.find((s) => s.id === skillId);
  if (!skill) throw Error('Unsupported algebra skill');
  let state = seed >>> 0;
  const rand = (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return 1 + (state % max);
  };
  const range = difficulty === 'intro' ? 4 : difficulty === 'practice' ? 8 : 12;
  let a = rand(range) + 1;
  const b = rand(range) + 1,
    c = rand(range) + 1,
    d = rand(range),
    x = rand(range) * (difficulty === 'challenge' && seed % 3 === 0 ? -1 : 1),
    variant = seed % 2;
  let expression = '',
    reference: string[] = [],
    alternativePaths: string[][] = [],
    answerForm: Question['answerForm'] = 'value',
    prompt = '';
  if (skillId === 'arithmetic-expressions') {
    expression = variant ? `(${a}+${b})*${c}` : `${a}+${b}*${c}`;
    const result = variant ? (a + b) * c : a + b * c;
    reference = [
      expression,
      variant ? `${a + b}*${c}` : `${a}+${b * c}`,
      `${result}`,
    ];
    alternativePaths = [[`${result}`]];
    prompt =
      'Evaluate the expression, respecting parentheses and operation order.';
  } else if (skillId === 'combine-like-terms') {
    expression = variant ? `${a}x-${b}x+${c}-${d}` : `${a}x+${b}x+${c}`;
    const result = affine(variant ? a - b : a + b, variant ? c - d : c);
    reference = [expression, result];
    alternativePaths = variant
      ? [[`${a}x+(${c}-${d})-${b}x`, result]]
      : [[`${c}+${a}x+${b}x`, result]];
    answerForm = 'simplified-affine';
    prompt =
      'Combine like terms. Finish with at most one x term and one constant.';
  } else if (skillId === 'one-step-equations') {
    expression = variant ? `${a}x=${b}` : `x+${b}=${x + b}`;
    const result = variant ? new Rational(b, a).toString() : `${x}`;
    reference = [expression, `x=${result}`];
    alternativePaths = [[`${result}=x`]];
    prompt = 'Solve for x using the same inverse operation on both sides.';
  } else if (skillId === 'distributive-property') {
    expression = variant ? `${a}(x+${b})=${a * (x + b)}` : `${a}(x-${b})`;
    reference = variant
      ? [
          expression,
          `${a}x+${a * b}=${a * (x + b)}`,
          `${a}x=${a * x}`,
          `x=${x}`,
        ]
      : [expression, affine(a, -a * b)];
    alternativePaths = variant
      ? [[`x+${b}=${x + b}`, `x=${x}`]]
      : [[affine(a, -a * b)]];
    answerForm = variant ? 'value' : 'simplified-affine';
    prompt = variant
      ? 'Solve for x. You may distribute first or divide both sides by the nonzero outside factor.'
      : 'Expand the expression by multiplying every term. Finish with one x term and one constant.';
  } else if (skillId === 'two-step-equations') {
    const rhs = variant
      ? new Rational(x, a).add(new Rational(b)).toString()
      : `${a * x + b}`;
    expression = variant ? `x/${a}+${b}=${rhs}` : `${a}x+${b}=${rhs}`;
    reference = [
      expression,
      variant ? `x/${a}=${new Rational(x, a)}` : `${a}x=${a * x}`,
      `x=${x}`,
    ];
    alternativePaths = variant
      ? [[`x+${a * b}=${x + a * b}`, `x=${x}`]]
      : [[`x+${b}/${a}=(${rhs})/${a}`, `x=${x}`]];
    prompt =
      'Solve the two-step equation. Apply each operation to both entire sides.';
  } else {
    a = c + a;
    const rhs = (a - c) * x + (variant ? a * b : b);
    expression = variant
      ? `${a}(x+${b})=${c}x+(${rhs})`
      : `${a}x+${b}=${c}x+(${rhs})`;
    reference = variant
      ? [
          expression,
          `${a}x+${a * b}=${c}x+(${rhs})`,
          `${a - c}x=${(a - c) * x}`,
          `x=${x}`,
        ]
      : [expression, `${a - c}x=${(a - c) * x}`, `x=${x}`];
    alternativePaths = [[`${c - a}x=${(c - a) * x}`, `x=${x}`]];
    prompt =
      'Solve the equation with x on both sides. Collect like terms while preserving equality.';
  }
  const selected = algebraTemplates.filter((t) => t.skillId === skillId)[
    variant
  ]!;
  return {
    id: `${skillId}-${difficulty}-${seed}`,
    templateId: selected.id,
    templateVersion: selected.version,
    skillId,
    seed,
    difficulty,
    expression,
    reference,
    alternativePaths,
    answerForm,
    prompt,
    explanation: skill.description,
    parameters: { a, b, c, d, x, variant },
    figure: {
      kind: 'algebra-structure',
      parts: expression.split('='),
      caption: expression.includes('=')
        ? 'Both sides must remain equal after each reversible operation.'
        : 'Rewrite this expression without changing its value. Group like terms and preserve operation order.',
    },
  };
}
