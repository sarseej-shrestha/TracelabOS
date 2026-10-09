import { Rational } from '../../math-engine/src/index.ts';
import type { Difficulty, Question, Skill } from './types.ts';
export const fractionSkills: readonly Skill[] = [
  {
    id: 'fraction-equivalence',
    unit: 'Fractions',
    title: 'Equivalent fractions',
    prerequisites: [],
    description:
      'A fraction keeps its value when numerator and denominator are multiplied or divided by the same nonzero number.',
    examples: [
      ['12/18', '(12/6)/(18/6)', '2/3'],
      ['3/5=x/20', '3*20=5*x', 'x=12'],
    ],
    standards: ['4.NF.A.1'],
    misconceptions: [
      'Changing only the numerator',
      'Cancelling digits instead of common factors',
    ],
    remediationSkillId: 'fraction-equivalence',
  },
  {
    id: 'fraction-addition',
    unit: 'Fractions',
    title: 'Add unlike fractions',
    prerequisites: ['fraction-equivalence'],
    description:
      'Represent equal-sized parts with a common denominator, then add the numerators. Like denominators already describe equal-sized parts.',
    examples: [
      ['1/2+1/3', '3/6+2/6', '5/6'],
      ['2/7+3/7', '(2+3)/7', '5/7'],
    ],
    standards: ['5.NF.A.1'],
    misconceptions: [
      'Adding denominators',
      'Changing a denominator without scaling its numerator',
    ],
    remediationSkillId: 'fraction-equivalence',
  },
  {
    id: 'fraction-subtraction',
    unit: 'Fractions',
    title: 'Subtract fractions',
    prerequisites: ['fraction-addition'],
    description:
      'Use equal-sized parts, subtract numerators, and keep the common denominator. Check that a positive quantity was taken away.',
    examples: [
      ['3/4-1/6', '9/12-2/12', '7/12'],
      ['5/8-1/8', '(5-1)/8', '1/2'],
    ],
    standards: ['5.NF.A.1'],
    misconceptions: [
      'Subtracting denominators',
      'Reversing the order of subtraction',
    ],
    remediationSkillId: 'fraction-addition',
  },
  {
    id: 'fraction-multiplication',
    unit: 'Fractions',
    title: 'Multiply fractions',
    prerequisites: ['fraction-equivalence'],
    description:
      'Multiply numerators and denominators. A fraction of a quantity scales that quantity; a factor less than one makes a positive quantity smaller.',
    examples: [
      ['(2/3)*(3/5)', '(2*3)/(3*5)', '2/5'],
      ['(3/4)*6', '(3*6)/4', '9/2'],
    ],
    standards: ['5.NF.B.4', '5.NF.B.5'],
    misconceptions: [
      'Multiplying numerators while keeping one denominator',
      'Expecting every product to be larger',
    ],
    remediationSkillId: 'fraction-equivalence',
  },
  {
    id: 'fraction-division',
    unit: 'Fractions',
    title: 'Divide by a fraction',
    prerequisites: ['fraction-multiplication'],
    description:
      'Division by a nonzero fraction is multiplication by its reciprocal. Only the divisor is inverted; check by multiplying the quotient by the divisor.',
    examples: [
      ['(3/4)/(2/5)', '(3/4)*(5/2)', '15/8'],
      ['(2/3)/4', '(2/3)*(1/4)', '1/6'],
    ],
    standards: ['6.NS.A.1'],
    misconceptions: [
      'Inverting the dividend',
      'Multiplying without taking the divisor reciprocal',
    ],
    remediationSkillId: 'fraction-multiplication',
  },
  {
    id: 'mixed-number-addition',
    unit: 'Fractions',
    title: 'Add mixed numbers',
    prerequisites: ['fraction-addition'],
    description:
      'Write each mixed number as a whole plus a fraction. Add the whole parts and use a common denominator for the fractional parts; an improper fraction is an accepted final form.',
    examples: [
      ['(1+1/2)+(2+1/3)', '3+3/6+2/6', '23/6'],
      ['(2+3/4)+(1+1/4)', '3+4/4', '4'],
    ],
    standards: ['5.NF.A.1'],
    misconceptions: [
      'Ignoring the whole-number parts',
      'Treating a mixed number as multiplication',
    ],
    remediationSkillId: 'fraction-addition',
  },
];
export const fractionTemplates = [
  ['fraction-equivalence', 'reduce-common-factor'],
  ['fraction-equivalence', 'missing-numerator'],
  ['fraction-addition', 'unlike-denominators'],
  ['fraction-addition', 'like-denominators'],
  ['fraction-subtraction', 'unlike-denominators'],
  ['fraction-subtraction', 'like-denominators'],
  ['fraction-multiplication', 'fraction-by-fraction'],
  ['fraction-multiplication', 'fraction-by-whole'],
  ['fraction-division', 'fraction-by-fraction'],
  ['fraction-division', 'fraction-by-whole'],
  ['mixed-number-addition', 'unlike-denominators'],
  ['mixed-number-addition', 'like-denominators'],
].map(([skillId, name]) => ({
  id: `${skillId}-${name}-v2`,
  skillId: skillId!,
  name: name!,
  version: '2.0.0',
}));
export function generateFraction(
  skillId: string,
  seed: number,
  difficulty: Difficulty,
): Question {
  const skill = fractionSkills.find((s) => s.id === skillId);
  if (!skill) throw Error('Unsupported fraction skill');
  let state = seed >>> 0;
  const rand = (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return 1 + (state % max);
  };
  const range = difficulty === 'intro' ? 4 : difficulty === 'practice' ? 8 : 12;
  const variant = seed % 2;
  let b = rand(range) + 1,
    d = variant ? b : rand(range) + 1;
  if (!variant && d === b) d = b === range + 1 ? 2 : b + 1;
  let a = rand(b - 1),
    c = rand(d - 1);
  const k = rand(4) + 1,
    w = rand(4),
    v = rand(3);
  if (skillId === 'fraction-subtraction' && a * d < c * b)
    [a, b, c, d] = [c, d, a, b];
  const left = new Rational(a, b),
    right = new Rational(c, d);
  let expression = '',
    reference: string[] = [],
    alternativePaths: string[][] = [],
    prompt = '',
    answerForm: Question['answerForm'] = 'value';
  let first = { numerator: a, denominator: b, label: 'First fraction' };
  const second = { numerator: c, denominator: d, label: 'Second fraction' };
  if (skillId === 'fraction-equivalence') {
    if (!variant) {
      expression = `${a * k}/${b * k}`;
      reference = [
        expression,
        `(${a * k}/${k})/(${b * k}/${k})`,
        left.toString(),
      ];
      alternativePaths = [[left.toString()]];
      prompt =
        'Simplify the fraction to lowest terms. Divide numerator and denominator by common factors.';
      answerForm = 'reduced-fraction';
      first = {
        numerator: a * k,
        denominator: b * k,
        label: 'Fraction to simplify',
      };
    } else {
      expression = `${a}/${b}=x/${b * k}`;
      reference = [expression, `${a * b * k}=${b}x`, `x=${a * k}`];
      alternativePaths = [[`x=${a * k}`]];
      prompt =
        'Find the missing numerator x so the fractions have equal value.';
      first.label = 'Known fraction';
    }
  } else if (
    skillId === 'fraction-addition' ||
    skillId === 'fraction-subtraction'
  ) {
    const op = skillId === 'fraction-addition' ? '+' : '-',
      answer = (op === '+' ? left.add(right) : left.sub(right)).toString();
    expression = `${a}/${b}${op}${c}/${d}`;
    const denominator = b === d ? b : b * d,
      n = a * (denominator / b),
      m = c * (denominator / d);
    reference = [
      expression,
      `${n}/${denominator}${op}${m}/${denominator}`,
      `(${n}${op}${m})/${denominator}`,
      answer,
    ];
    alternativePaths = [[answer]];
    prompt = `${op === '+' ? 'Add' : 'Subtract'} the fractions. Use equal-sized parts and show the common denominator.`;
  } else if (skillId === 'fraction-multiplication') {
    expression = variant ? `(${a}/${b})*${k}` : `(${a}/${b})*(${c}/${d})`;
    const answer = left.mul(variant ? new Rational(k) : right).toString();
    reference = [
      expression,
      variant ? `(${a}*${k})/${b}` : `(${a}*${c})/(${b}*${d})`,
      answer,
    ];
    alternativePaths = [[answer]];
    prompt =
      'Multiply. You may cancel common factors before multiplying, or simplify the product afterward.';
  } else if (skillId === 'fraction-division') {
    expression = variant ? `(${a}/${b})/${k}` : `(${a}/${b})/(${c}/${d})`;
    const answer = left.div(variant ? new Rational(k) : right).toString();
    reference = [
      expression,
      variant ? `(${a}/${b})*(1/${k})` : `(${a}/${b})*(${d}/${c})`,
      answer,
    ];
    alternativePaths = [[answer]];
    prompt =
      'Divide by multiplying by the reciprocal of the divisor. Check that the divisor is not zero.';
  } else {
    expression = `(${w}+${a}/${b})+(${v}+${c}/${d})`;
    const answer = new Rational(w + v).add(left).add(right).toString();
    reference = [expression, `${w + v}+(${a * d}+${c * b})/${b * d}`, answer];
    alternativePaths = [[`${w * b + a}/${b}+${v * d + c}/${d}`, answer]];
    prompt =
      'Add the mixed numbers. Enter mixed numbers as whole + fraction, with parentheses. A single improper fraction is accepted.';
    first.label = 'Fractional part of first mixed number';
    second.label = 'Fractional part of second mixed number';
  }
  const selected = fractionTemplates.filter((t) => t.skillId === skillId)[
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
    prompt,
    answerForm,
    explanation: skill.description,
    parameters: { a, b, c, d, k, w, v, variant },
    figure: {
      kind: 'fraction-bars',
      caption:
        skillId === 'mixed-number-addition'
          ? 'Fractional parts only; include the whole-number parts shown in the question.'
          : 'Each bar represents one whole split into equal-sized parts.',
      fractions:
        skillId === 'fraction-equivalence' ||
        (variant &&
          ['fraction-multiplication', 'fraction-division'].includes(skillId))
          ? [first]
          : [first, second],
    },
  };
}
