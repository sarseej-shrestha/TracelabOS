import { expect, it, describe } from 'vitest';
import fc from 'fast-check';
import {
  ratioSkills,
  ratioTemplates,
} from '../../packages/question-bank/src/ratios.ts';
import {
  generateQuestion,
  skills,
} from '../../packages/question-bank/src/index.ts';
import { evaluateQuestion } from '../../packages/question-bank/src/grading.ts';
import { evaluate, Rational } from '../../packages/math-engine/src/index.ts';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { QuestionDiagram } from '../../packages/ui/src/question-diagram.tsx';
for (const template of ratioTemplates)
  it(`${template.id} has valid reference and alternative paths with a bounded figure`, () => {
    const variant = ratioTemplates
      .filter((t) => t.skillId === template.skillId)
      .findIndex((t) => t.id === template.id);
    for (const difficulty of ['intro', 'practice', 'challenge'] as const)
      for (let i = 0; i < 40; i++) {
        const q = generateQuestion(
          template.skillId,
          i * 2 + variant,
          difficulty,
        );
        expect(q.templateId).toBe(template.id);
        for (const path of [q.reference, ...q.alternativePaths!])
          expect(evaluateQuestion(q, path)).toMatchObject({
            complete: true,
            firstError: null,
            requiresReview: false,
          });
        expect(q.figure).toBeDefined();
        const html = renderToStaticMarkup(
          createElement(QuestionDiagram, { figure: q.figure! }),
        );
        expect(html).toContain('x');
        expect(q.prompt.length).toBeGreaterThan(40);
      }
  });
it('verifies worked examples and prerequisite references', () => {
  for (const skill of ratioSkills) {
    expect(skill.examples.length).toBeGreaterThanOrEqual(2);
    for (const id of [...skill.prerequisites, skill.remediationSkillId!])
      expect(skills.some((s) => s.id === id)).toBe(true);
    for (const path of skill.examples)
      expect(
        evaluateQuestion(
          {
            ...generateQuestion(skill.id, 0),
            expression: path[0]!,
            reasoningDomain: path[0]!.includes('=')
              ? 'positive-proportion'
              : undefined,
          },
          [...path],
        ).complete,
      ).toBe(true);
  }
});
describe('positive-proportion domain', () => {
  it('retains original student input and declared conditions', () => {
    const lines = ['2/3=4/x', '2x=12', 'x=6'];
    const result = evaluate(lines[0]!, lines, 'positive-proportion');
    expect(result.complete).toBe(true);
    expect(result.steps.map((s) => s.input)).toEqual(lines);
    expect(result.domainConditions).toEqual([
      'x > 0; every denominator must be nonzero.',
    ]);
  });
  it('does not globally enable variable denominators', () =>
    expect(() => evaluate('2/3=4/x', ['x=6'])).toThrow(
      /Variable denominators/,
    ));
  it.each([
    '2/x=3/x',
    'x/x=1',
    '0/x=0',
    '2/(x-1)=4/3',
    '2/(x*x)=4/3',
    '2/(x/x)=4/3',
    '1/(1/x)=6',
    'x=0',
    'x=-6',
    '2/0=x/3',
    'x=x',
    '0x=0',
    'x*x=36',
  ])('keeps unsupported or invalid domain %s in review', (line) => {
    const result = evaluate('2/3=4/x', [line, 'x=6'], 'positive-proportion');
    expect(result.complete).toBe(false);
    expect(result.requiresReview).toBe(true);
    expect(result.steps.at(-1)!.outcome).toBe(
      ['x=x', '0x=0'].includes(line) ? 'AMBIGUOUS' : 'REQUIRES_REVIEW',
    );
  });
  it('marks a changed positive solution and preserves propagated reasoning', () => {
    const r = evaluate('2/3=4/x', ['3x=8', 'x=8/3'], 'positive-proportion');
    expect(r.steps.map((s) => s.outcome)).toEqual([
      'FIRST_ERROR',
      'PROPAGATED_ERROR',
    ]);
  });
  it('accepts reciprocal proportions and rational positive answers', () => {
    expect(
      evaluate(
        '3/4=x/6',
        ['4/3=6/x', '3x=27/2', 'x=9/2'],
        'positive-proportion',
      ).complete,
    ).toBe(true);
  });
  it('checks 2,000 seeded denominator-clearing cases and perturbations', () =>
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        fc.integer({ min: 1, max: 100 }),
        (a, b, c) => {
          const answer = new Rational(b * c, a);
          const r = evaluate(
            `${a}/${b}=${c}/x`,
            [`${a}x=${b * c}`, `x=${answer}`],
            'positive-proportion',
          );
          expect(r.complete).toBe(true);
          expect(
            evaluate(
              `${a}/${b}=${c}/x`,
              [`x=${answer.add(new Rational(1))}`],
              'positive-proportion',
            ).firstError,
          ).toBe(1);
        },
      ),
      { numRuns: 2000, seed: 20261009 },
    ));
});

it.each([
  ['unit-rates', '12/3', '1/4', 'RATE_DIRECTION'],
  ['equivalent-ratios', '2/3=x/9', 'x=8', 'MULTIPLICATIVE_SCALING'],
  ['solve-proportions', '2/3=4/x', 'x=8/3', 'CROSS_MULTIPLY_OPPOSITE'],
  ['percent-part-whole', '25/100*80', '2000', 'PERCENT_PER_HUNDRED'],
  ['percent-change', '80+25/100*80', '20', 'INCLUDE_ORIGINAL_AMOUNT'],
  ['percent-change', '80+25/100*80', '105', 'PERCENT_IS_NOT_AMOUNT'],
])(
  'classifies the observed %s pattern',
  (skillId, expression, wrong, ruleId) => {
    const q = {
      ...generateQuestion(skillId, 0),
      expression,
      parameters: {
        a: skillId === 'unit-rates' ? 4 : 2,
        b: 3,
        c: 4,
        k: 3,
        p: 25,
        whole: 80,
        variant: 0,
      },
    };
    expect(evaluateQuestion(q, [wrong]).steps[0]).toMatchObject({
      outcome: 'FIRST_ERROR',
      ruleId,
    });
  },
);
it('does not classify an unrelated wrong value as a known misconception', () => {
  const q = generateQuestion('unit-rates', 0);
  expect(evaluateQuestion(q, ['99999']).steps[0]!.ruleId).toBe(
    'EQUIVALENCE_CHANGED',
  );
});
