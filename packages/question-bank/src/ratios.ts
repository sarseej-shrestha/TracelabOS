import { Rational } from '../../math-engine/src/index.ts';
import type { Difficulty, Question, RatioFigure, Skill } from './types.ts';
export const ratioSkills: readonly Skill[] = [
  {
    id: 'unit-rates',
    unit: 'Ratios and proportions',
    title: 'Find a unit rate',
    prerequisites: ['fraction-division'],
    description:
      'Divide the total quantity by the number of units. Keep the requested quantity in the numerator; reversing the ratio changes the units.',
    examples: [
      ['12/3', '4'],
      ['15/2', '15/2'],
    ],
    standards: ['6.RP.A.2', '6.RP.A.3b'],
    misconceptions: [
      'Inverting the requested rate',
      'Subtracting instead of dividing',
    ],
    remediationSkillId: 'fraction-division',
  },
  {
    id: 'equivalent-ratios',
    unit: 'Ratios and proportions',
    title: 'Scale equivalent ratios',
    prerequisites: ['fraction-equivalence', 'one-step-equations'],
    description:
      'Multiply both quantities by the same positive factor. Adding the same number to both parts usually changes the ratio.',
    examples: [
      ['2/3=x/9', '3x=18', 'x=6'],
      ['2/3=8/x', '2x=24', 'x=12'],
    ],
    standards: ['6.RP.A.3a'],
    misconceptions: [
      'Adding the same amount to both quantities',
      'Scaling only one quantity',
    ],
    remediationSkillId: 'fraction-equivalence',
  },
  {
    id: 'proportional-scaling',
    unit: 'Ratios and proportions',
    title: 'Read a proportional table',
    prerequisites: ['unit-rates', 'equivalent-ratios'],
    description:
      'A proportional table keeps a constant output per input. Use a scale factor or divide to a unit rate, then multiply to the requested quantity.',
    examples: [
      ['x/5=6/3', '3x=30', 'x=10'],
      ['10/x=6/3', '6x=30', 'x=5'],
    ],
    standards: ['6.RP.A.3a', '7.RP.A.2b', '7.RP.A.2c'],
    misconceptions: [
      'Using an additive change for proportional quantities',
      'Reversing only one ratio',
    ],
    remediationSkillId: 'unit-rates',
  },
  {
    id: 'solve-proportions',
    unit: 'Ratios and proportions',
    title: 'Solve a proportion',
    prerequisites: ['equivalent-ratios', 'one-step-equations'],
    description:
      'For positive quantities, multiply both sides by the nonzero denominators. Cross products are equal only while the denominator conditions are preserved.',
    examples: [
      ['2/3=4/x', '2x=12', 'x=6'],
      ['3/4=x/6', '4x=18', 'x=9/2'],
    ],
    standards: ['7.RP.A.2c'],
    misconceptions: [
      'Multiplying corresponding rather than opposite terms',
      'Ignoring a zero denominator',
    ],
    remediationSkillId: 'equivalent-ratios',
  },
  {
    id: 'percent-part-whole',
    unit: 'Ratios and proportions',
    title: 'Relate percent, part and whole',
    prerequisites: ['fraction-multiplication', 'one-step-equations'],
    description:
      'Percent means per hundred. Multiply the whole by percent/100 to find the part; divide a known part by that nonzero fraction to recover the whole.',
    examples: [
      ['25/100*80', '20'],
      ['25/100*x=20', 'x=80'],
    ],
    standards: ['6.RP.A.3c'],
    misconceptions: [
      'Treating a percent as a whole-number multiplier',
      'Using the part as the whole',
    ],
    remediationSkillId: 'fraction-multiplication',
  },
  {
    id: 'percent-change',
    unit: 'Ratios and proportions',
    title: 'Apply a percent change',
    prerequisites: ['percent-part-whole'],
    description:
      'Compute the change from the original amount, then add it for an increase or subtract it for a decrease. The change amount alone is not the new total.',
    examples: [
      ['80+20/100*80', '80+16', '96'],
      ['80-20/100*80', '80-16', '64'],
    ],
    standards: ['7.RP.A.3'],
    misconceptions: [
      'Reporting only the change',
      'Adding the percentage as an amount',
    ],
    remediationSkillId: 'percent-part-whole',
  },
];
export const ratioTemplates = [
  ['unit-rates', 'unit-price'],
  ['unit-rates', 'constant-speed'],
  ['equivalent-ratios', 'missing-numerator'],
  ['equivalent-ratios', 'missing-denominator'],
  ['proportional-scaling', 'missing-output'],
  ['proportional-scaling', 'missing-input'],
  ['solve-proportions', 'unknown-denominator'],
  ['solve-proportions', 'unknown-numerator'],
  ['percent-part-whole', 'find-part'],
  ['percent-part-whole', 'find-whole'],
  ['percent-change', 'increase'],
  ['percent-change', 'decrease'],
].map(([skillId, name]) => ({
  id: `${skillId}-${name}-v2`,
  skillId: skillId!,
  name: name!,
  version: '2.0.0',
}));
export function generateRatio(
  skillId: string,
  seed: number,
  difficulty: Difficulty,
): Question {
  const skill = ratioSkills.find((s) => s.id === skillId);
  if (!skill) throw Error('Unsupported ratio skill');
  let state = seed >>> 0;
  const rand = (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return 1 + (state % max);
  };
  const range = difficulty === 'intro' ? 4 : difficulty === 'practice' ? 9 : 16;
  const a = rand(range) + 1,
    b = rand(range) + 1,
    c = rand(range) + 1,
    k = rand(difficulty === 'intro' ? 3 : 6) + 1,
    p = 5 * rand(8),
    whole = 10 * rand(range),
    variant = seed % 2;
  let expression = '',
    prompt = '',
    reference: string[] = [],
    alternativePaths: string[][] = [];
  let figure: RatioFigure = {
    kind: 'ratio-table',
    labels: ['First quantity', 'Second quantity'],
    rows: [],
    caption: skill.description,
  };
  if (skillId === 'unit-rates') {
    expression = `${a * k}/${b}`;
    const result = new Rational(a * k, b).toString();
    prompt = variant
      ? `A cyclist travels ${a * k} km in ${b} hours at a constant speed. Find the speed in km per hour. Enter the numerical value; the requested units are fixed.`
      : `${b} notebooks cost $${a * k}. Find the price in dollars per notebook. Enter the numerical value; the requested units are fixed.`;
    reference = [expression, result];
    alternativePaths = [[`${expression}=${result}`]];
    figure = {
      ...figure,
      labels: variant ? ['Hours', 'Kilometres'] : ['Notebooks', 'Dollars'],
      rows: [
        [`${b}`, `${a * k}`],
        ['1', 'x'],
      ],
    };
  } else if (skillId === 'equivalent-ratios') {
    expression = variant ? `${a}/${b}=${a * k}/x` : `${a}/${b}=x/${b * k}`;
    const answer = variant ? b * k : a * k,
      coefficient = variant ? a : b;
    prompt =
      'Find the missing positive quantity x. Scale both quantities by the same factor. The condition x > 0 excludes zero denominators.';
    reference = [expression, `${coefficient}x=${a * b * k}`, `x=${answer}`];
    alternativePaths = [[`x=${variant ? b : a}*${k}`, `x=${answer}`]];
    figure = {
      ...figure,
      rows: [
        [`${a}`, `${b}`],
        [variant ? `${a * k}` : 'x', variant ? 'x' : `${b * k}`],
      ],
    };
  } else if (skillId === 'proportional-scaling') {
    expression = variant ? `${a * k}/x=${a}/${b}` : `x/${b * k}=${a}/${b}`;
    const answer = variant ? b * k : a * k,
      coefficient = variant ? a : b;
    prompt = variant
      ? `${b} litres of paint cover ${a} square metres. At the same coverage rate, how many litres x cover ${a * k} square metres? Use x > 0.`
      : `${b} litres of paint cover ${a} square metres. At the same coverage rate, how many square metres x do ${b * k} litres cover? Use x > 0.`;
    reference = [expression, `${coefficient}x=${a * b * k}`, `x=${answer}`];
    alternativePaths = [
      [
        `x=(${variant ? b : a}/${variant ? a : b})*${variant ? a * k : b * k}`,
        `x=${answer}`,
      ],
    ];
    figure = {
      kind: 'double-number-line',
      labels: ['Litres', 'Square metres'],
      rows: [
        ['0', '0'],
        [`${b}`, `${a}`],
        [variant ? 'x' : `${b * k}`, variant ? `${a * k}` : 'x'],
      ],
      positions: [0, 1 / k, 1],
      caption:
        'Aligned marks represent corresponding quantities. Equal scale factors preserve the coverage rate.',
    };
  } else if (skillId === 'solve-proportions') {
    expression = variant ? `${a}/${b}=x/${c}` : `${a}/${b}=${c}/x`;
    const numerator = variant ? a * c : b * c,
      coefficient = variant ? b : a;
    const result = new Rational(numerator, coefficient).toString();
    prompt =
      'Solve for the positive quantity x. State equivalent equations; all denominators must remain nonzero.';
    reference = [expression, `${coefficient}x=${numerator}`, `x=${result}`];
    alternativePaths = [
      [`x=(${variant ? a : b}/${variant ? b : a})*${c}`, `x=${result}`],
    ];
    figure = {
      ...figure,
      rows: [
        [`${a}`, `${b}`],
        [variant ? 'x' : `${c}`, variant ? `${c}` : 'x'],
      ],
    };
  } else if (skillId === 'percent-part-whole') {
    const part = new Rational(p * whole, 100).toString();
    expression = variant ? `${p}/100*x=${part}` : `${p}/100*${whole}`;
    prompt = variant
      ? `${part} is ${p}% of a positive number x. Find the whole x, using x > 0.`
      : `Find ${p}% of ${whole}. Enter the numerical value of the part.`;
    reference = variant
      ? [expression, `${p}x=${p * whole}`, `x=${whole}`]
      : [expression, part];
    alternativePaths = variant
      ? [[`x=(${part})/(${p}/100)`, `x=${whole}`]]
      : [[`${whole}*${p}/100`, part]];
    figure = {
      ...figure,
      labels: ['Percent', 'Amount'],
      rows: [
        ['100', variant ? 'x' : `${whole}`],
        [`${p}`, variant ? part : 'x'],
      ],
    };
  } else {
    const sign = variant ? '-' : '+',
      change = new Rational(p * whole, 100),
      result = new Rational(whole)
        .add(variant ? change.neg() : change)
        .toString();
    expression = `${whole}${sign}${p}/100*${whole}`;
    prompt = `An amount starts at ${whole} and ${variant ? 'decreases' : 'increases'} by ${p}%. Find the new amount, including the original amount. Enter its numerical value.`;
    reference = [expression, `${whole}${sign}(${change})`, result];
    alternativePaths = [[`${whole}*(100${sign}${p})/100`, result]];
    figure = {
      ...figure,
      labels: ['Percent of original', 'Amount'],
      rows: [
        ['100', `${whole}`],
        [`${100 + (variant ? -p : p)}`, 'x'],
      ],
    };
  }
  const template = ratioTemplates.filter((t) => t.skillId === skillId)[
    variant
  ]!;
  return {
    id: `${skillId}-${difficulty}-${seed}`,
    templateId: template.id,
    templateVersion: template.version,
    skillId,
    seed,
    difficulty,
    prompt,
    expression,
    reference,
    alternativePaths,
    parameters: { a, b, c, k, p, whole, variant },
    explanation: skill.description,
    figure,
    answerForm: 'value',
    ...(expression.includes('=')
      ? { reasoningDomain: 'positive-proportion' as const }
      : {}),
  };
}

/** Label observed values only; never infer an unshown operation as fact. */
export function ratioErrorCandidates(question: Question) {
  const { a, b, c, k, p, whole, variant } = question.parameters as Record<
    string,
    number
  > & {
    a: number;
    b: number;
    c: number;
    k: number;
    p: number;
    whole: number;
    variant: number;
  };
  const make = (value: Rational, ruleId: string, explanation: string) => ({
    value: value.toString(),
    ruleId,
    explanation,
    skillId: question.skillId,
  });
  if (question.skillId === 'unit-rates')
    return [
      make(
        new Rational(b, a * k),
        'RATE_DIRECTION',
        'This value matches the inverse rate. Check the requested units: divide the total quantity by the number of units.',
      ),
    ];
  if (['equivalent-ratios', 'proportional-scaling'].includes(question.skillId))
    return [
      make(
        new Rational(variant ? b + a * (k - 1) : a + b * (k - 1)),
        'MULTIPLICATIVE_SCALING',
        'This value matches adding the change in one quantity to the other. Proportional quantities use the same scale factor, rather than the same added amount.',
      ),
    ];
  if (question.skillId === 'solve-proportions')
    return [
      make(
        new Rational(variant ? b * c : a * c, variant ? a : b),
        'CROSS_MULTIPLY_OPPOSITE',
        'This value matches pairing the wrong terms when clearing denominators. For a/b = c/d with nonzero denominators, the cross products a*d and b*c must be equal.',
      ),
    ];
  if (question.skillId === 'percent-part-whole')
    return [
      make(
        variant ? new Rational(p * p * whole, 10000) : new Rational(p * whole),
        'PERCENT_PER_HUNDRED',
        'This value matches using an incorrect percent multiplier. Percent means per hundred; find the whole by dividing the part by percent/100.',
      ),
    ];
  if (question.skillId === 'percent-change')
    return [
      make(
        new Rational(p * whole, 100),
        'INCLUDE_ORIGINAL_AMOUNT',
        'This is the size of the change. Add it to or subtract it from the original amount to find the new total.',
      ),
      make(
        new Rational(whole + (variant ? -p : p)),
        'PERCENT_IS_NOT_AMOUNT',
        'This value matches adding or subtracting the percentage as an amount. First calculate percent/100 times the original amount.',
      ),
    ];
  return [];
}
