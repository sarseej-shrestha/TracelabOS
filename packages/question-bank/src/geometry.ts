import { Rational } from '../../math-engine/src/index.ts';
import type { Difficulty, GeometryFigure, Question, Skill } from './types.ts';
export const geometrySkills: readonly Skill[] = [
  {
    id: 'rectangle-area',
    unit: 'Geometry',
    title: 'Find rectangle area',
    prerequisites: ['fraction-multiplication'],
    description:
      'Multiply perpendicular side lengths. The result measures covered space in square units; fractional side lengths use the same rule.',
    examples: [
      ['8*3', '24 cm²'],
      ['5*(3/2)', '15/2 cm²'],
    ],
    standards: ['4.MD.A.3', '5.NF.B.4b'],
    misconceptions: [
      'Using perimeter instead of area',
      'Reporting a length unit for area',
    ],
    remediationSkillId: 'fraction-multiplication',
  },
  {
    id: 'rectangle-perimeter',
    unit: 'Geometry',
    title: 'Find rectangle perimeter',
    prerequisites: ['arithmetic-expressions'],
    description:
      'Add all four boundary lengths. Opposite sides of a rectangle are equal; a square has four equal sides. Perimeter uses length units.',
    examples: [
      ['2*(8+3)', '22 cm'],
      ['4*5', '20 cm'],
    ],
    standards: ['4.MD.A.3'],
    misconceptions: ['Multiplying length and width', 'Counting only two sides'],
    remediationSkillId: 'arithmetic-expressions',
  },
  {
    id: 'triangle-area',
    unit: 'Geometry',
    title: 'Find triangle area',
    prerequisites: ['rectangle-area', 'fraction-division'],
    description:
      'Multiply base by perpendicular height, then divide by two. A sloping side is not the height. Right and oblique triangles follow the same area rule.',
    examples: [
      ['8*3/2', '12 cm²'],
      ['5*3/2', '15/2 cm²'],
    ],
    standards: ['6.G.A.1'],
    misconceptions: [
      'Omitting the factor one half',
      'Using a slanted side as height',
    ],
    remediationSkillId: 'rectangle-area',
  },
  {
    id: 'composite-area',
    unit: 'Geometry',
    title: 'Decompose composite area',
    prerequisites: ['rectangle-area', 'fraction-subtraction'],
    description:
      'Split a rectilinear figure into non-overlapping rectangles, or subtract a missing rectangle from a bounding rectangle. Do not double-count overlaps or include cutouts.',
    examples: [
      ['8*6-3*2', '48-6', '42 cm²'],
      ['5*6+3*4', '30+12', '42 cm²'],
    ],
    standards: ['6.G.A.1'],
    misconceptions: [
      'Including the missing corner',
      'Subtracting a length from an area',
    ],
    remediationSkillId: 'rectangle-area',
  },
  {
    id: 'missing-length',
    unit: 'Geometry',
    title: 'Recover a missing length',
    prerequisites: [
      'rectangle-area',
      'rectangle-perimeter',
      'fraction-division',
    ],
    description:
      'For known rectangle area, divide by the known side. For known perimeter, halve it and subtract the known side. The recovered side is a length, not an area.',
    examples: [
      ['24/8', '3 cm'],
      ['22/2-8', '3 cm'],
    ],
    standards: ['4.MD.A.3', '6.EE.B.7'],
    misconceptions: [
      'Using area as a length',
      'Subtracting from the full perimeter',
    ],
    remediationSkillId: 'rectangle-perimeter',
  },
  {
    id: 'area-unit-conversion',
    unit: 'Geometry',
    title: 'Convert square metric units',
    prerequisites: ['rectangle-area', 'equivalent-ratios'],
    description:
      'Square the length-conversion factor for area. One centimetre is ten millimetres, so one square centimetre is one hundred square millimetres.',
    examples: [
      ['24*100', '2400 mm²'],
      ['2*10000', '20000 cm²'],
    ],
    standards: ['5.MD.A.1', '6.RP.A.3d'],
    misconceptions: [
      'Using the linear conversion factor for area',
      'Changing the unit without changing the number',
    ],
    remediationSkillId: 'equivalent-ratios',
  },
];
export const geometryTemplates = [
  ['rectangle-area', 'whole-sides'],
  ['rectangle-area', 'fractional-side'],
  ['rectangle-perimeter', 'rectangle'],
  ['rectangle-perimeter', 'square'],
  ['triangle-area', 'right-triangle'],
  ['triangle-area', 'oblique-triangle'],
  ['composite-area', 'subtract-cutout'],
  ['composite-area', 'join-rectangles'],
  ['missing-length', 'from-area'],
  ['missing-length', 'from-perimeter'],
  ['area-unit-conversion', 'square-centimetres-to-millimetres'],
  ['area-unit-conversion', 'square-metres-to-centimetres'],
].map(([skillId, name]) => ({
  id: `${skillId}-${name}-v2`,
  skillId: skillId!,
  name: name!,
  version: '2.0.0',
}));
export function generateGeometry(
  skillId: string,
  seed: number,
  difficulty: Difficulty,
): Question {
  const skill = geometrySkills.find((s) => s.id === skillId);
  if (!skill) throw Error('Unsupported geometry skill');
  let state = seed >>> 0;
  const rand = (max: number) => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return 1 + (state % max);
  };
  const range = difficulty === 'intro' ? 4 : difficulty === 'practice' ? 8 : 14;
  const a = rand(range) + 1,
    b = rand(range) + 1,
    c = rand(range) + 1,
    d = rand(range) + 1,
    variant = seed % 2;
  const half = skillId === 'rectangle-area' && variant ? 2 : 1;
  let expression = '',
    prompt = '',
    reference: string[] = [],
    alternativePaths: string[][] = [];
  let answerUnit: NonNullable<Question['answerUnit']> = {
    unit: 'cm',
    power: 2,
  };
  let figure: GeometryFigure = {
    kind: 'geometry',
    points: [
      [55, 45],
      [265, 45],
      [265, 185],
      [55, 185],
    ],
    labels: [
      { x: 160, y: 210, text: `${a} cm` },
      { x: 305, y: 120, text: `${new Rational(b, half)} cm` },
    ],
    caption:
      'Known dimensions; drawing is schematic. Use the labeled lengths, not measurements of the screen.',
  };
  if (skillId === 'rectangle-area') {
    expression = variant ? `${a}*(${b}/2)` : `${a}*${b}`;
    const result = new Rational(a * b, half).toString();
    prompt =
      'Find the rectangle’s area. Show numerical calculations and finish with square units.';
    reference = [expression, `${result} cm²`];
    alternativePaths = [[`${a}cm*(${b}/${half})cm`, `${result} cm²`]];
  } else if (skillId === 'rectangle-perimeter') {
    answerUnit = { unit: 'cm', power: 1 };
    expression = variant ? `4*${a}` : `2*(${a}+${b})`;
    const side = variant ? a : b,
      result = 2 * (a + side);
    prompt = `Find the ${variant ? 'square' : 'rectangle'}’s perimeter. Include all four sides and finish with length units.`;
    reference = [expression, `${result} cm`];
    alternativePaths = [[`${a}cm+${side}cm+${a}cm+${side}cm`, `${result} cm`]];
    if (variant) {
      figure.points = [
        [90, 30],
        [250, 30],
        [250, 190],
        [90, 190],
      ];
      figure.labels = [
        { x: 170, y: 215, text: `${a} cm` },
        { x: 290, y: 115, text: `${a} cm` },
      ];
    }
  } else if (skillId === 'triangle-area') {
    expression = `${a}*${b}/2`;
    const result = new Rational(a * b, 2).toString();
    prompt = `Find the ${variant ? 'oblique' : 'right'} triangle’s area using its base and perpendicular height. Finish with square units.`;
    reference = [expression, `${result} cm²`];
    alternativePaths = [[`(${a}cm*${b}cm)/2`, `${result} cm²`]];
    const top = variant ? 150 : 55;
    figure = {
      ...figure,
      points: [
        [55, 185],
        [265, 185],
        [top, 45],
      ],
      labels: [
        { x: 160, y: 210, text: `base ${a} cm` },
        { x: variant ? 190 : 95, y: 100, text: `height ${b} cm` },
      ],
      guides: [{ from: [top, 45], to: [top, 185] }],
      caption:
        'The dashed height meets the base at a right angle. It is the perpendicular distance, not the sloping side.',
    };
  } else if (skillId === 'composite-area') {
    const height = b + d,
      width = a + c,
      xx = 55 + 210 * Math.max(0.3, Math.min(0.7, a / width)),
      yy = 45 + 140 * Math.max(0.3, Math.min(0.7, d / height));
    expression = variant
      ? `${a}*${height}+${c}*${b}`
      : `${width}*${height}-${c}*${d}`;
    const result = a * height + c * b;
    prompt = variant
      ? 'Find the L-shaped area by joining two non-overlapping rectangles. Finish with square units.'
      : 'Find the L-shaped area by subtracting the missing corner from a rectangle. Finish with square units.';
    reference = [expression, `${result} cm²`];
    alternativePaths = [
      [
        variant
          ? `${width}cm*${height}cm-${c}cm*${d}cm`
          : `${a}cm*${height}cm+${c}cm*${b}cm`,
        `${result} cm²`,
      ],
    ];
    figure = {
      ...figure,
      points: [
        [55, 45],
        [xx, 45],
        [xx, yy],
        [265, yy],
        [265, 185],
        [55, 185],
      ],
      labels: [
        { x: (55 + xx) / 2, y: 25, text: `${a} cm` },
        { x: 25, y: 120, text: `${height} cm` },
        { x: 160, y: 210, text: `${width} cm` },
        { x: 300, y: (yy + 185) / 2, text: `${b} cm` },
        { x: (xx + 265) / 2, y: yy - 12, text: `${c} cm` },
        { x: xx - 27, y: (45 + yy) / 2, text: `${d} cm` },
      ],
      guides: [{ from: [xx, yy], to: [xx, 185] }],
      caption:
        'The corner at the upper right is missing. Dashed lines show a decomposition; dimensions describe the original lengths.',
    };
  } else if (skillId === 'missing-length') {
    answerUnit = { unit: 'cm', power: 1 };
    expression = variant ? `${2 * (a + b)}/2-${a}` : `${a * b}/${a}`;
    prompt = variant
      ? `A rectangle has perimeter ${2 * (a + b)} cm and one side ${a} cm. Find the other side. Use numerical calculations and finish with length units.`
      : `A rectangle has area ${a * b} cm² and one side ${a} cm. Find the other side. Use numerical calculations and finish with length units.`;
    reference = [expression, `${b} cm`];
    alternativePaths = [
      [
        variant ? `(${2 * (a + b)}cm-2*${a}cm)/2` : `${a * b}cm²/(${a}cm)`,
        `${b} cm`,
      ],
    ];
    figure.labels[1]!.text = '? cm';
  } else {
    const factor = variant ? 10000 : 100,
      inputUnit = variant ? 'm' : 'cm';
    answerUnit = { unit: variant ? 'cm' : 'mm', power: 2 };
    expression = `${a * b}*${factor}`;
    prompt = `This rectangle has area ${a * b} ${inputUnit}². Express its area in ${answerUnit.unit}². Square the metric length-conversion factor.`;
    reference = [expression, `${a * b * factor} ${answerUnit.unit}²`];
    alternativePaths = [
      [
        `${a}${inputUnit}*${b}${inputUnit}`,
        `${a * b * factor} ${answerUnit.unit}²`,
      ],
    ];
    figure.labels = [
      { x: 160, y: 210, text: `${a} ${inputUnit}` },
      { x: 305, y: 120, text: `${b} ${inputUnit}` },
    ];
  }
  const template = geometryTemplates.filter((t) => t.skillId === skillId)[
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
    answerUnit,
    answerForm: 'value',
    parameters: { a, b, c, d, half, variant },
    figure,
    explanation: skill.description,
  };
}

export function geometryErrorCandidates(question: Question) {
  const { a, b, c, d, half, variant } = question.parameters as {
    a: number;
    b: number;
    c: number;
    d: number;
    half: number;
    variant: number;
  };
  const make = (value: Rational, ruleId: string, explanation: string) => ({
    value,
    ruleId,
    explanation,
  });
  if (question.skillId === 'rectangle-area')
    return [
      make(
        new Rational(a).add(new Rational(b, half)).mul(new Rational(2)),
        'AREA_VS_PERIMETER',
        'This value matches the perimeter calculation. Area multiplies perpendicular side lengths and uses square units.',
      ),
    ];
  if (question.skillId === 'rectangle-perimeter')
    return [
      make(
        new Rational(a * (variant ? a : b)),
        'PERIMETER_VS_AREA',
        'This value matches multiplying side lengths for area. Perimeter adds all four boundary lengths.',
      ),
      make(
        new Rational(a + (variant ? a : b)),
        'ALL_FOUR_SIDES',
        'This value matches counting only two sides. Include both pairs of equal sides.',
      ),
    ];
  if (question.skillId === 'triangle-area')
    return [
      make(
        new Rational(a * b),
        'TRIANGLE_HALF',
        'This value matches base times height without dividing by two. A triangle occupies half of the corresponding rectangle.',
      ),
    ];
  if (question.skillId === 'composite-area')
    return [
      make(
        new Rational((a + c) * (b + d)),
        'REMOVE_CUTOUT',
        'This value includes the missing corner. Subtract its rectangular area, or add only the non-overlapping pieces.',
      ),
    ];
  if (question.skillId === 'missing-length')
    return [
      make(
        new Rational(variant ? 2 * (a + b) - a : a * b),
        'INVERSE_GEOMETRY_FORMULA',
        'This value matches using the total without the required inverse step. Divide area by the known side, or halve perimeter before subtracting the known side.',
      ),
    ];
  if (question.skillId === 'area-unit-conversion')
    return [
      make(
        new Rational(a * b * (variant ? 100 : 10)),
        'SQUARE_CONVERSION_FACTOR',
        'This value matches the linear conversion factor. Area needs that factor squared because both length dimensions change.',
      ),
    ];
  return [];
}
