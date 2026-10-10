import { expect, it } from 'vitest';
import {
  geometrySkills,
  geometryTemplates,
} from '../../packages/question-bank/src/geometry.ts';
import {
  generateQuestion,
  skills,
} from '../../packages/question-bank/src/index.ts';
import { evaluateQuestion } from '../../packages/question-bank/src/grading.ts';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { QuestionDiagram } from '../../packages/ui/src/question-diagram.tsx';
for (const template of geometryTemplates)
  it(`${template.id} has dimensionally valid references and alternatives`, () => {
    const variant = geometryTemplates
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
        expect(q.answerUnit).toBeDefined();
        for (const path of [q.reference, ...q.alternativePaths!])
          expect(evaluateQuestion(q, path)).toMatchObject({
            complete: true,
            firstError: null,
            requiresReview: false,
          });
        if (q.figure?.kind !== 'geometry')
          throw Error('Missing geometry figure');
        expect(
          q.figure.points.every(
            ([x, y]) => x >= 0 && x <= 360 && y >= 0 && y <= 235,
          ),
        ).toBe(true);
        expect(
          q.figure.labels.every(
            ({ x, y }) => x >= 0 && x <= 360 && y >= 0 && y <= 235,
          ),
        ).toBe(true);
        expect(
          renderToStaticMarkup(
            createElement(QuestionDiagram, { figure: q.figure }),
          ),
        ).toContain('role="img"');
      }
  });
it('verifies worked examples and requires units rather than numeric-only completion', () => {
  for (const skill of geometrySkills) {
    expect(skill.examples.length).toBeGreaterThanOrEqual(2);
    skill.examples.forEach((path, variant) => {
      const q = {
        ...generateQuestion(skill.id, variant),
        expression: path[0]!,
      };
      expect(evaluateQuestion(q, [...path]).complete).toBe(true);
      expect(
        evaluateQuestion(q, [path.at(-1)!.replace(/\s*(mm|cm|m)²?$/, '')]),
      ).toMatchObject({
        complete: false,
        firstError: null,
        completionHint: expect.any(String),
      });
    });
  }
});
it('distinguishes an area value with length units from a correct submission', () => {
  const q = { ...generateQuestion('rectangle-area', 0), expression: '8*3' };
  expect(evaluateQuestion(q, ['24 cm']).steps[0]).toMatchObject({
    outcome: 'FIRST_ERROR',
    ruleId: 'UNIT_DIMENSION',
    skillId: 'rectangle-area',
  });
  expect(evaluateQuestion(q, ['2400 mm²']).complete).toBe(true);
});
it('keeps unsupported symbolic formulas in review before a correct final quantity', () => {
  const q = generateQuestion('triangle-area', 0);
  expect(evaluateQuestion(q, ['A=b*h/2', ...q.reference])).toMatchObject({
    complete: false,
    requiresReview: true,
  });
});
it.each([
  ['rectangle-area', '8*3', '22 cm²', 'AREA_VS_PERIMETER'],
  ['rectangle-perimeter', '2*(8+3)', '24 cm', 'PERIMETER_VS_AREA'],
  ['rectangle-perimeter', '2*(8+3)', '11 cm', 'ALL_FOUR_SIDES'],
  ['triangle-area', '8*3/2', '24 cm²', 'TRIANGLE_HALF'],
  ['composite-area', '11*5-3*2', '55 cm²', 'REMOVE_CUTOUT'],
  ['missing-length', '24/8', '24 cm', 'INVERSE_GEOMETRY_FORMULA'],
  ['area-unit-conversion', '24*100', '240 mm²', 'SQUARE_CONVERSION_FACTOR'],
])('classifies the observed %s value', (skillId, expression, wrong, ruleId) => {
  const q = {
    ...generateQuestion(skillId, 0),
    expression,
    parameters: { a: 8, b: 3, c: 3, d: 2, half: 1, variant: 0 },
  };
  expect(evaluateQuestion(q, [wrong]).steps[0]).toMatchObject({
    outcome: 'FIRST_ERROR',
    ruleId,
  });
});
it('does not substitute a formula classification for an explicit unit-dimension error', () => {
  const q = {
    ...generateQuestion('rectangle-area', 0),
    expression: '8*3',
    parameters: { a: 8, b: 3, c: 3, d: 2, half: 1, variant: 0 },
  };
  expect(evaluateQuestion(q, ['22 cm']).steps[0]!.ruleId).toBe(
    'UNIT_DIMENSION',
  );
});

it('all four units form a known acyclic graph with valid remediation targets', () => {
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
  expect(new Set(skills.map((s) => s.id)).size).toBe(skills.length);
  for (const skill of skills) {
    visit(skill.id);
    expect(skills.some((s) => s.id === skill.remediationSkillId)).toBe(true);
  }
});
