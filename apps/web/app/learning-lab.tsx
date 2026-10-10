'use client';
import { useState } from 'react';
import {
  BKT_PARAMETERS,
  estimateMastery,
  MASTERY_VERSION,
  MIN_EVIDENCE,
  READY_THRESHOLD,
} from '../../../packages/learning-engine/src/mastery';
import report from '../../../artifacts/adaptive-strategy-results.json';

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
const responseProbability = (knowledge: number) =>
  knowledge * (1 - BKT_PARAMETERS.slip) +
  (1 - knowledge) * BKT_PARAMETERS.guess;
const models = [
  ['constant', 'Training constant'],
  ['frequency', 'Smoothed frequency'],
  ['bkt', 'Bayesian Knowledge Tracing'],
] as const;
const scenarioNames = [
  'Matched, no forgetting',
  'Varied skills with forgetting',
];
const source = 'https://github.com/sarseej-shrestha/TracelabOS/blob/main/';
const limit = 20;

export function LearningLab() {
  const [observations, setObservations] = useState<boolean[]>([]);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const estimate = estimateMastery(observations);
  const scenario = report.scenarios[scenarioIndex]!;
  const path = Array.from({ length: observations.length + 1 }, (_, index) =>
    estimateMastery(observations.slice(0, index)),
  );
  const status = {
    insufficient_evidence: 'More evidence needed',
    developing: 'Continue focused practice',
    ready_to_practice_further: 'Ready to try further variations',
  }[estimate.status];
  function add(correct: boolean) {
    setObservations((previous) =>
      previous.length < limit ? [...previous, correct] : previous,
    );
  }
  return (
    <div className="learning-lab">
      <section className="card" aria-labelledby="lab-title">
        <div className="eyebrow">ALGORITHM LAB · FICTIONAL OUTCOMES</div>
        <h2 id="lab-title">What changes after one answer?</h2>
        <p>
          Try a sequence of reviewed outcomes for one skill. This sandbox runs
          the application’s estimator in your browser; it saves nothing to
          student records. Leaving this view clears the sequence.
        </p>
        <div
          className="lab-actions"
          role="group"
          aria-label="Fictional outcomes"
        >
          <button
            className="primary"
            disabled={observations.length === limit}
            onClick={() => add(true)}
          >
            Add correct outcome
          </button>
          <button
            className="secondary"
            disabled={observations.length === limit}
            onClick={() => add(false)}
          >
            Add needs-practice outcome
          </button>
          <button
            className="secondary"
            disabled={!observations.length}
            onClick={() => setObservations((previous) => previous.slice(0, -1))}
          >
            Undo last outcome
          </button>
          <button
            className="text-button"
            disabled={!observations.length}
            onClick={() => setObservations([])}
          >
            Reset experiment
          </button>
        </div>
        <p role="status" className="lab-status">
          {observations.length} of {limit} fictional outcomes. {status}.
        </p>
        <dl className="lab-estimates">
          <div>
            <dt>Model belief that the skill is known</dt>
            <dd>{percent(estimate.probability)}</dd>
          </div>
          <div>
            <dt>BKT prediction of next correct answer</dt>
            <dd>{percent(responseProbability(estimate.probability))}</dd>
          </div>
          <div>
            <dt>Frequency prediction of next correct answer</dt>
            <dd>{percent(estimate.baseline)}</dd>
          </div>
        </dl>
        <figure className="lab-chart">
          <svg
            viewBox="0 0 640 200"
            role="img"
            aria-labelledby="lab-chart-title lab-chart-description"
          >
            <title id="lab-chart-title">
              Knowledge belief after each fictional outcome
            </title>
            <desc id="lab-chart-description">
              Starts at 20 percent. Current belief is{' '}
              {percent(estimate.probability)} after {observations.length}{' '}
              outcomes. Exact changes are in the observation table below.
            </desc>
            {[0, 0.5, 1].map((tick) => (
              <g key={tick}>
                <line
                  x1="48"
                  x2="616"
                  y1={166 - tick * 140}
                  y2={166 - tick * 140}
                  stroke="#dbe2da"
                />
                <text x="0" y={171 - tick * 140} fill="#213731" fontSize="14">
                  {tick * 100}%
                </text>
              </g>
            ))}
            <polyline
              fill="none"
              stroke="#28634d"
              strokeWidth="3"
              points={path
                .map(
                  (item, index) =>
                    `${48 + (index / limit) * 568},${166 - item.probability * 140}`,
                )
                .join(' ')}
            />
            {path.map((item, index) => (
              <circle
                key={index}
                cx={48 + (index / limit) * 568}
                cy={166 - item.probability * 140}
                r="4"
                fill="#28634d"
              />
            ))}
            <text x="48" y="194" fill="#213731" fontSize="14">
              0 outcomes
            </text>
            <text x="616" y="194" textAnchor="end" fill="#213731" fontSize="14">
              20 outcomes
            </text>
          </svg>
          <figcaption>
            Model belief changes with the order of outcomes. It is not a grade
            or a calibrated measure of ability.
          </figcaption>
        </figure>
        <details>
          <summary>Inspect each observation</summary>
          {observations.length ? (
            <div
              className="lab-table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Observation table"
            >
              <table>
                <caption>
                  Predictions are made before observing the outcome; belief is
                  updated afterwards.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Trial</th>
                    <th scope="col">Outcome</th>
                    <th scope="col">BKT prediction</th>
                    <th scope="col">Frequency prediction</th>
                    <th scope="col">Belief after update</th>
                  </tr>
                </thead>
                <tbody>
                  {observations.map((correct, index) => (
                    <tr key={index}>
                      <th scope="row">{index + 1}</th>
                      <td>{correct ? 'Correct' : 'Needs practice'}</td>
                      <td>
                        {percent(responseProbability(path[index]!.probability))}
                      </td>
                      <td>{percent(path[index]!.baseline)}</td>
                      <td>{percent(path[index + 1]!.probability)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>Add an outcome to inspect the update.</p>
          )}
        </details>
        <details>
          <summary>Model assumptions and readiness rule</summary>
          <p>
            Version {MASTERY_VERSION}. Initial knowledge belief{' '}
            {percent(BKT_PARAMETERS.prior)}, learning transition{' '}
            {percent(BKT_PARAMETERS.learn)}, guess{' '}
            {percent(BKT_PARAMETERS.guess)}, slip {percent(BKT_PARAMETERS.slip)}
            . Bayes’ rule updates belief from each outcome, then applies the
            learning transition. There is no forgetting or difficulty effect.
          </p>
          <p>
            Further variations require at least {MIN_EVIDENCE} reviewed outcomes
            and belief of {percent(READY_THRESHOLD)}. These parameters and
            thresholds are provisional, not fitted to real students. Frequency
            uses (correct + 1) / (total + 2). Response prediction allows
            guessing and slips; it is distinct from knowledge belief.
          </p>
        </details>
      </section>
      <section className="card" aria-labelledby="evidence-title">
        <div className="eyebrow">
          REPRODUCIBLE EXPERIMENT · SYNTHETIC DATA ONLY
        </div>
        <h2 id="evidence-title">
          Compare predictions, question the assumptions.
        </h2>
        <p>
          This published experiment uses fictional learners. It does not
          establish learning gains or calibration for real students. The first
          generator intentionally matches BKT; its advantage there is expected.
        </p>
        <label className="lab-scenario">
          Simulation scenario
          <select
            value={scenarioIndex}
            onChange={(event) => setScenarioIndex(Number(event.target.value))}
          >
            {scenarioNames.map((name, index) => (
              <option key={name} value={index}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <p role="status">
          {scenario.testLearners} held-out synthetic learners ·{' '}
          {scenario.predictionMetrics.bkt.observations.toLocaleString('en-US')}{' '}
          predictions. {scenario.trainingLearners} separate learners fit the
          constant baseline.
        </p>
        <div
          className="lab-table-scroll"
          tabIndex={0}
          role="region"
          aria-label="Prediction metrics"
        >
          <table>
            <caption>
              {scenarioNames[scenarioIndex]}: smaller Brier error and log loss
              are better for these simulated responses.
            </caption>
            <thead>
              <tr>
                <th scope="col">Predictor</th>
                <th scope="col">Brier error</th>
                <th scope="col">95% resampling interval</th>
                <th scope="col">Log loss</th>
              </tr>
            </thead>
            <tbody>
              {models.map(([key, title]) => {
                const result = scenario.predictionMetrics[key];
                return (
                  <tr key={key}>
                    <th scope="row">{title}</th>
                    <td>{result.brier.toFixed(6)}</td>
                    <td>
                      {result.brierLearnerBootstrap95
                        .map((value) => value.toFixed(6))
                        .join(' – ')}
                    </td>
                    <td>{result.logLoss.toFixed(6)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          Intervals resample whole synthetic learners{' '}
          {report.bootstrapReplicates.toLocaleString('en-US')} times. They
          describe variation under these generators, not uncertainty about real
          learners. Practice-selection diagnostics are reported separately in
          the evidence file.
        </p>
        <details>
          <summary>Reproduction and limitations</summary>
          <p>
            Experiment {report.experimentVersion} · generator{' '}
            {report.generatorVersion} · seed {report.seed} · estimator{' '}
            {report.algorithmVersion}.
          </p>
          <ul>
            {report.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
          <p>
            Dataset SHA-256:{' '}
            <code className="lab-digest">{report.datasetSha256}</code>
          </p>
        </details>
        <div className="lab-actions">
          <a href={`${source}research/adaptive-evaluation/README.md`}>
            Methodology and reproduction commands
          </a>
          <a href={`${source}artifacts/adaptive-strategy-results.json`}>
            Published measurement file
          </a>
        </div>
      </section>
    </div>
  );
}
