/** Provisional standard BKT: no forgetting, no fitted student/difficulty effects. */
export const MASTERY_VERSION = 'bkt-reviewed-1';
export type BktParameters = {
  prior: number;
  learn: number;
  guess: number;
  slip: number;
};
export const BKT_PARAMETERS: Readonly<BktParameters> = Object.freeze({
  prior: 0.2,
  learn: 0.1,
  guess: 0.25,
  slip: 0.1,
});
export const READY_THRESHOLD = 0.85;
export const MIN_EVIDENCE = 3;
const bounded = (value: number) => Math.min(1 - 1e-9, Math.max(1e-9, value));
export function updateKnowledge(
  probability: number,
  correct: boolean,
  parameters: BktParameters = BKT_PARAMETERS,
) {
  if (
    !Number.isFinite(probability) ||
    probability < 0 ||
    probability > 1 ||
    Object.values(parameters).some(
      (p) => !Number.isFinite(p) || p <= 0 || p >= 1,
    ) ||
    parameters.guess + parameters.slip >= 1
  )
    throw new Error('INVALID_BKT_PARAMETERS');
  const p = bounded(probability);
  const known = p * (correct ? 1 - parameters.slip : parameters.slip);
  const unknown = (1 - p) * (correct ? parameters.guess : 1 - parameters.guess);
  const posterior = known / (known + unknown);
  return bounded(posterior + (1 - posterior) * parameters.learn);
}
export function estimateMastery(observations: readonly boolean[]) {
  let probability = BKT_PARAMETERS.prior;
  for (const correct of observations)
    probability = updateKnowledge(probability, correct);
  const correctCount = observations.filter(Boolean).length;
  return {
    algorithmVersion: MASTERY_VERSION,
    probability,
    evidenceCount: observations.length,
    correctCount,
    baseline: (correctCount + 1) / (observations.length + 2),
    entropy:
      -probability * Math.log2(probability) -
      (1 - probability) * Math.log2(1 - probability),
    status:
      observations.length < MIN_EVIDENCE
        ? 'insufficient_evidence'
        : probability >= READY_THRESHOLD
          ? 'ready_to_practice_further'
          : 'developing',
  } as const;
}
export type MasteryEstimate = ReturnType<typeof estimateMastery>;
