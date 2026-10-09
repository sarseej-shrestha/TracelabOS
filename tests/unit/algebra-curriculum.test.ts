import { expect, it, describe } from 'vitest';
import {
  algebraSkills,
  algebraTemplates,
} from '../../packages/question-bank/src/algebra.ts';
import {
  generateQuestion,
  skills,
} from '../../packages/question-bank/src/index.ts';
import { evaluateQuestion } from '../../packages/question-bank/src/grading.ts';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { QuestionDiagram } from '../../packages/ui/src/question-diagram.tsx';
for (const template of algebraTemplates)
  it(`${template.id} verifies references, alternate paths and figure labels`, () => {
    const variant = algebraTemplates
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
        for (const path of [q.reference, ...q.alternativePaths!])
          expect(evaluateQuestion(q, path)).toMatchObject({
            complete: true,
            firstError: null,
            requiresReview: false,
          });
        if (q.figure?.kind !== 'algebra-structure')
          throw Error('Expected algebra diagram');
        expect(q.figure.parts.join('=')).toBe(q.expression);
        const html = renderToStaticMarkup(
          createElement(QuestionDiagram, { figure: q.figure }),
        );
        expect(html).toContain('role="img"');
        if (q.skillId === 'arithmetic-expressions')
          expect(q.parameters.c).toBeGreaterThan(1);
      }
  });
it('verifies all algebra examples and an acyclic prerequisite graph', () => {
  const done = new Set<string>(),
    active = new Set<string>();
  const visit = (id: string) => {
    expect(active.has(id)).toBe(false);
    if (done.has(id)) return;
    const skill = skills.find((s) => s.id === id);
    expect(skill).toBeDefined();
    active.add(id);
    skill!.prerequisites.forEach(visit);
    active.delete(id);
    done.add(id);
  };
  for (const skill of algebraSkills) {
    visit(skill.id);
    expect(skill.examples.length).toBeGreaterThanOrEqual(2);
    expect(skills.some((s) => s.id === skill.remediationSkillId)).toBe(true);
    for (const lines of skill.examples) {
      const q = {
        ...generateQuestion(skill.id, 0),
        expression: lines[0]!,
        answerForm: lines[0]!.includes('=')
          ? ('value' as const)
          : ('simplified-affine' as const),
      };
      expect(evaluateQuestion(q, [...lines])).toMatchObject({
        complete: true,
        firstError: null,
        requiresReview: false,
      });
    }
  }
});
describe('affine completion without claiming an unshown operation', () => {
  const q = {
    ...generateQuestion('combine-like-terms', 0),
    expression: '3x+2x+4',
  };
  it.each(['3x+2x+4', '(3+2)*x+4', '5*(x+4/5)', '5x+2+2'])(
    'leaves equivalent but uncombined %s incomplete',
    (line) =>
      expect(evaluateQuestion(q, [line])).toMatchObject({
        complete: false,
        firstError: null,
        completionHint: expect.any(String),
      }),
  );
  it.each(['5x+4', '4+5x', 'x*5+4'])(
    'accepts a collected equivalent %s',
    (line) => expect(evaluateQuestion(q, [line]).complete).toBe(true),
  );
  it('keeps identities and nonlinear input in review', () => {
    expect(evaluateQuestion(q, ['5x+4=5x+4']).requiresReview).toBe(true);
    expect(evaluateQuestion(q, ['x*x+4']).requiresReview).toBe(true);
  });
  it.each(['0x+2', '1*x', 'x+0'])(
    'requires redundant factors/terms to be removed from %s',
    (expression) =>
      expect(
        evaluateQuestion({ ...q, expression }, [expression]).complete,
      ).toBe(false),
  );
  it('allows variable cancellation to yield a constant', () =>
    expect(
      evaluateQuestion({ ...q, expression: '3x-3x+2' }, ['2']).complete,
    ).toBe(true));
  it('does not mark an inequivalent collected expression complete', () =>
    expect(evaluateQuestion(q, ['5x+5'])).toMatchObject({
      complete: false,
      firstError: 1,
    }));
});
