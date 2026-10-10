import { expect, it } from 'vitest';
import {
  predictionPath,
  practiceChoices,
} from '../../research/adaptive-evaluation/strategies.ts';
import { skills } from '../../packages/question-bank/src/index.ts';
import { prerequisiteOrder } from '../../packages/learning-engine/src/prerequisites.ts';
it('predicts before observing and starts each skill with its independent prior', () => {
  const rows = predictionPath([true, false], 0.6);
  expect(rows[0]).toEqual({
    outcome: true,
    predictions: { constant: 0.6, frequency: 0.5, bkt: 0.38 },
  });
  expect(rows[1]!.predictions.frequency).toBeCloseTo(2 / 3);
  expect(rows[1]!.predictions.bkt).toBeCloseTo(
    (10 / 19) * 0.9 + (9 / 19) * 0.25,
  );
  expect(predictionPath([false], 0.6)[0]!.predictions).toEqual(
    rows[0]!.predictions,
  );
});
it('future outcomes cannot change earlier predictions', () => {
  const first = predictionPath([true, false, true, true], 0.52);
  const second = predictionPath([true, false, false, false], 0.52);
  expect(first.slice(0, 2)).toEqual(second.slice(0, 2));
  expect(first[2]!.predictions).toEqual(second[2]!.predictions);
  expect(first[3]!.predictions.bkt).not.toEqual(second[3]!.predictions.bkt);
});
it.each([0, 1, -1, NaN, Infinity])(
  'rejects invalid trained baseline %s',
  (constant) =>
    expect(() => predictionPath([true], constant)).toThrow('INVALID_BASELINE'),
);
it('uses conservative evidence counts and the same production prerequisite traversal', () => {
  const ancestors = prerequisiteOrder(skills, 'distributive-property');
  const empty = practiceChoices('distributive-property', {});
  expect(empty).toEqual({
    baseline: 'distributive-property',
    rules: ancestors[0],
    bkt: ancestors[0],
  });
  const sparse = Object.fromEntries(
    skills.map((skill) => [skill.id, [true, true]]),
  );
  expect(practiceChoices('distributive-property', sparse)).toEqual(empty);
  const ready = Object.fromEntries(
    skills.map((skill) => [skill.id, [true, true, true]]),
  );
  expect(practiceChoices('distributive-property', ready)).toEqual({
    baseline: 'distributive-property',
    rules: 'distributive-property',
    bkt: 'distributive-property',
  });
});
it('does not allow evidence from unknown skills to satisfy real prerequisites', () => {
  expect(
    practiceChoices('distributive-property', { invented: [true, true, true] }),
  ).toEqual(practiceChoices('distributive-property', {}));
  expect(() => practiceChoices('invented', {})).toThrow('INVALID_SKILL_GRAPH');
});
it('does not mutate histories when comparing strategies', () => {
  const observations = Object.freeze([true, false, true]);
  const histories = Object.freeze({ 'arithmetic-expressions': observations });
  expect(() =>
    practiceChoices('distributive-property', histories),
  ).not.toThrow();
  expect(predictionPath(observations, 0.5)).toHaveLength(3);
  expect(observations).toEqual([true, false, true]);
});
