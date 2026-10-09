import { describe, expect, it } from 'vitest';
import {
  generateQuestion,
  generateLegacyQuestion,
  skills,
  fractionTemplates,
} from '../../packages/question-bank/src/index.ts';
import { fractionSkills } from '../../packages/question-bank/src/fractions.ts';
import { evaluateQuestion } from '../../packages/question-bank/src/grading.ts';
import { evaluate } from '../../packages/math-engine/src/index.ts';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { FractionBars } from '../../packages/ui/src/fraction-bars.tsx';
for (const template of fractionTemplates) {
  it(`${template.id}: both solution paths and operand figures agree across difficulty and seeds`, () => {
    const variant = fractionTemplates
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
        expect(q.templateVersion).toBe('2.0.0');
        expect(evaluateQuestion(q, q.reference)).toMatchObject({
          complete: true,
          firstError: null,
          requiresReview: false,
        });
        for (const alternative of q.alternativePaths!)
          expect(evaluateQuestion(q, alternative).complete).toBe(true);
        for (const figure of q.figure!.fractions) {
          expect(figure.numerator).toBeLessThan(figure.denominator);
          expect(figure.denominator).toBeGreaterThan(0);
        }
        const p = q.parameters;
        expect(
          q.figure!.fractions[0]!.numerator /
            q.figure!.fractions[0]!.denominator,
        ).toBeCloseTo(p.a! / p.b!, 12);
        const html = renderToStaticMarkup(
          createElement(FractionBars, { figure: q.figure! }),
        );
        expect((html.match(/<rect /g) ?? []).length).toBe(
          q.figure!.fractions.reduce((sum, f) => sum + f.denominator, 0),
        );
        expect((html.match(/fill="#24644c"/g) ?? []).length).toBe(
          q.figure!.fractions.reduce((sum, f) => sum + f.numerator, 0),
        );
        expect(html).toContain('role="img"');
      }
  });
}
it('worked examples are valid and prerequisite/remediation links form a known acyclic graph', () => {
  const visited = new Set<string>(),
    active = new Set<string>();
  const visit = (id: string) => {
    expect(active.has(id)).toBe(false);
    if (visited.has(id)) return;
    const skill = skills.find((s) => s.id === id);
    expect(skill).toBeDefined();
    active.add(id);
    for (const next of skill!.prerequisites) visit(next);
    active.delete(id);
    visited.add(id);
  };
  for (const skill of fractionSkills) {
    visit(skill.id);
    expect(skill.examples.length).toBeGreaterThanOrEqual(2);
    expect(skills.some((s) => s.id === skill.remediationSkillId)).toBe(true);
    expect(skill.standards!.length).toBeGreaterThan(0);
    for (const example of skill.examples)
      expect(evaluate(example[0]!, [...example]).complete).toBe(true);
  }
});
describe('simplification completion', () => {
  const q = {
    ...generateQuestion('fraction-equivalence', 0),
    expression: '12/18',
  };
  it.each(['12/18', '6/9', '12/18=6/9', '0.6666666666666666'])(
    'does not mark %s as a completed reduced fraction',
    (line) => expect(evaluateQuestion(q, [line]).complete).toBe(false),
  );
  it.each(['2/3', '12/18=2/3', '2/3=12/18'])(
    'accepts the reduced equivalent form %s',
    (line) => expect(evaluateQuestion(q, [line]).complete).toBe(true),
  );
  it('preserves valid steps but provides an actionable completion hint', () =>
    expect(evaluateQuestion(q, ['6/9'])).toMatchObject({
      firstError: null,
      complete: false,
      completionHint: expect.stringContaining('lowest terms'),
    }));
  it('applies the requirement to saved legacy simplification questions', () => {
    const old = generateLegacyQuestion('fraction-equivalence', 42);
    expect(old.answerForm).toBeUndefined();
    expect(evaluateQuestion(old, [old.expression]).complete).toBe(false);
    expect(evaluateQuestion(old, old.reference).complete).toBe(true);
  });
  it('does not impose a reduced-fraction requirement on missing-numerator equations', () => {
    const q = generateQuestion('fraction-equivalence', 1);
    expect(q.answerForm).toBe('value');
    expect(evaluateQuestion(q, q.reference).complete).toBe(true);
  });
  it('accepts an integer when the simplified value is integral', () =>
    expect(evaluateQuestion({ ...q, expression: '6/3' }, ['2']).complete).toBe(
      true,
    ));
});

describe('supported fraction misconception patterns', () => {
  it.each([
    ['1/2+1/3', '2/6', 'SCALE_NUMERATORS'],
    ['3/4-1/2', '2/2', 'SUBTRACT_DENOMINATORS'],
    ['(2/3)*(3/4)', '6/7', 'MULTIPLY_DENOMINATORS'],
    ['(2/3)/(3/4)', '1/2', 'RECIPROCAL_DIVISOR'],
    ['(2/3)/(3/4)', '9/8', 'INVERT_DIVISOR_ONLY'],
    ['12/18', '6/18', 'SCALE_BOTH_PARTS'],
  ])(
    'identifies %s -> %s without claiming an unshown proof',
    (problem, line, rule) =>
      expect(evaluate(problem, [line]).steps[0]).toMatchObject({
        outcome: 'FIRST_ERROR',
        ruleId: rule,
      }),
  );
  it.each([
    ['1/2+1/3', '5/6'],
    ['3/4-1/2', '1/4'],
    ['(2/3)*(3/4)', '1/2'],
    ['(2/3)/(3/4)', '8/9'],
    ['12/18', '2/3'],
  ])(
    'does not classify a correct %s -> %s as a misconception',
    (problem, line) => expect(evaluate(problem, [line]).firstError).toBeNull(),
  );
  it('keeps unsupported variable denominators in review', () =>
    expect(evaluate('(2/3)/(3/4)', ['2/x']).requiresReview).toBe(true));
  it('keeps unclassified fraction errors on the assigned skill for remediation', () => {
    const q = generateQuestion('fraction-division', 0);
    expect(evaluateQuestion(q, ['999']).steps[0]?.skillId).toBe(
      'fraction-division',
    );
  });
});
