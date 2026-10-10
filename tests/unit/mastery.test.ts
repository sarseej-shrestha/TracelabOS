import { expect, it } from 'vitest';
import fc from 'fast-check';
import {
  BKT_PARAMETERS,
  estimateMastery,
  updateKnowledge,
} from '../../packages/learning-engine/src/mastery.ts';
import { prerequisiteOrder } from '../../packages/learning-engine/src/prerequisites.ts';
import { skills } from '../../packages/question-bank/src/index.ts';
import { recommend } from '../../packages/learning-engine/src/index.ts';
import { evaluate } from '../../packages/math-engine/src/index.ts';
it('implements Bayes evidence and learning separately with independently calculated fractions', () => {
  // Correct posterior = .18/.38 = 9/19; after learning = 10/19.
  expect(updateKnowledge(0.2, true)).toBeCloseTo(10 / 19, 14);
  // Incorrect posterior = .02/.62 = 1/31; after learning = 4/31.
  expect(updateKnowledge(0.2, false)).toBeCloseTo(4 / 31, 14);
});
it('does not equate sparse evidence with readiness', () => {
  expect(estimateMastery([])).toMatchObject({
    probability: 0.2,
    evidenceCount: 0,
    status: 'insufficient_evidence',
    baseline: 0.5,
  });
  expect(estimateMastery([true, true]).status).toBe('insufficient_evidence');
  expect(estimateMastery([true, true, true]).status).toBe(
    'ready_to_practice_further',
  );
  expect(estimateMastery([false, false, false]).status).toBe('developing');
});
it.each([NaN, Infinity, -1, 2])('rejects invalid probability %s', (p) =>
  expect(() => updateKnowledge(p, true)).toThrow('INVALID_BKT_PARAMETERS'),
);
it.each(['prior', 'learn', 'guess', 'slip'] as const)(
  'rejects degenerate or nonfinite %s',
  (key) => {
    for (const value of [0, 1, NaN, Infinity, -0.1])
      expect(() =>
        updateKnowledge(0.2, true, { ...BKT_PARAMETERS, [key]: value }),
      ).toThrow();
  },
);
it('rejects inverted emission probabilities', () =>
  expect(() =>
    updateKnowledge(0.2, true, { ...BKT_PARAMETERS, guess: 0.9, slip: 0.2 }),
  ).toThrow());
it('remains responsive after long success sequences', () => {
  const p = estimateMastery(Array(2000).fill(true)).probability;
  expect(p).toBeLessThan(1);
  expect(updateKnowledge(p, false)).toBeLessThan(p);
});
it('keeps finite estimates, entropy and baseline in range over seeded sequences', () => {
  fc.assert(
    fc.property(fc.array(fc.boolean(), { maxLength: 500 }), (observations) => {
      const estimate = estimateMastery(observations);
      expect(estimate.probability).toBeGreaterThan(0);
      expect(estimate.probability).toBeLessThan(1);
      expect(estimate.entropy).toBeGreaterThanOrEqual(0);
      expect(estimate.entropy).toBeLessThanOrEqual(1);
      expect(estimate.baseline).toBeGreaterThan(0);
      expect(estimate.baseline).toBeLessThan(1);
      expect(estimate.evidenceCount).toBe(observations.length);
      expect(estimate.correctCount).toBe(observations.filter(Boolean).length);
    }),
    { seed: 20261010, numRuns: 1000 },
  );
});
it('validates all curriculum nodes and orders ancestors before descendants', () => {
  for (const skill of skills) {
    const order = prerequisiteOrder(skills, skill.id);
    expect(new Set(order).size).toBe(order.length);
    expect(order).not.toContain(skill.id);
    for (const id of order)
      for (const prerequisite of skills.find((s) => s.id === id)!.prerequisites)
        expect(order.indexOf(prerequisite)).toBeLessThan(order.indexOf(id));
  }
});
it.each([
  [{ id: 'a', prerequisites: ['a'] }],
  [{ id: 'a', prerequisites: ['b'] }],
  [
    { id: 'a', prerequisites: [] },
    { id: 'a', prerequisites: [] },
  ],
  [
    { id: 'a', prerequisites: [] },
    { id: 'b', prerequisites: ['c'] },
    { id: 'c', prerequisites: ['b'] },
  ],
])('rejects invalid graph %j', (...graph) =>
  expect(() => prerequisiteOrder(graph, 'a')).toThrow(),
);
it('selects a transitive unmet prerequisite and advances when its evidence is sufficient', () => {
  const evaluation = evaluate('3(x-2)=15', ['3(x-2)=15', '3x-2=15']);
  const ancestors = prerequisiteOrder(skills, 'distributive-property');
  expect(recommend('distributive-property', evaluation).skillId).toBe(
    ancestors[0],
  );
  expect(
    recommend('distributive-property', evaluation, new Set(ancestors)).skillId,
  ).toBe('distributive-property');
});
