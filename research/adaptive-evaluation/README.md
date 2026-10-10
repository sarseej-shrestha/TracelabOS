# Reviewed mastery experiments

The application persists one evidence item per reviewed submission, scoped to classroom/student/skill. Corrected reviews replace that item; `requires_review` retracts it. Original reviews and automatic evaluations remain immutable. Replaying evidence in original attempt order produces `bkt-reviewed-1` estimates and an evidence count. The model has provisional, unfitted parameters: prior .2, learning .1, guess .25, slip .1; no forgetting or difficulty effect. At least three observations and .85 probability are required to suggest further variations. These are product heuristics, not validated cutoffs.

Standard BKT recurrence follows the definitions in [Badrinath, Wang and Pardos (2021)](https://educationaldatamining.org/EDM2021/virtual/static/pdf/EDM21_paper_237.pdf). Each response updates the belief using Bayes' rule, then applies a learning transition. Our independent Python check propagates known/unknown state mass with 50-digit Decimal arithmetic. It is an arithmetic check, not a fit or efficacy experiment.

```sh
pnpm oracle:mastery
python3 research/adaptive-evaluation/verify.py
python3 -m unittest discover -s research/adaptive-evaluation -p 'test_*.py'
```

Measured: all 2,047 binary sequences of lengths 0–10 agree within 1e-12; maximum absolute difference 1.099120794378905e-14. Four Python unit tests pass. TypeScript also tests 1,000 seeded longer sequences, invalid parameters, extreme success histories and prerequisite graph safety. Reports are in `artifacts/mastery-oracle-{vectors,results}.json`.

A smoothed success baseline and model entropy are calculated for experiments. Entropy describes this model's belief, not parameter uncertainty or a calibrated confidence interval. Targeted remediation is delivered through real assignments and a verified historical rebuild can backfill old reviews. The held-out synthetic strategy comparison below evaluates prediction and practice selection separately. There is no real student dataset or demonstrated learning gain.

## Frozen strategy comparison

Use Node 22 and Python 3.13; the Python experiment uses only the standard library.

```sh
pnpm adaptive:catalog
python3 research/adaptive-evaluation/generate.py
pnpm adaptive:score
python3 research/adaptive-evaluation/evaluate.py --check
python3 -m unittest discover -s research/adaptive-evaluation -p 'test_*.py'
```

The checked-in report is `artifacts/adaptive-strategy-results.json`. Omit `--check` only when deliberately regenerating a report after investigating a change. CI regenerates the exact dataset and scores, verifies their hashes and compares metrics within 1e-12. Generated synthetic inputs/scores stay under ignored `.data/adaptive-evaluation` and are uploaded as explicitly selected CI artifacts; no application records are read.

Generator `synthetic-trajectories-1`, seed 20261010, creates two cohorts of 180 fictional learners across 24 skills. Sixty learners per cohort fit only the smoothed constant baseline; 120 disjoint learners are evaluated. Each skill has 0–12 observations. Responses depend on a binary hidden skill state, then a learning/forgetting transition occurs. Skill histories are independent: prerequisite learning dependence is deliberately not modeled. The matched scenario uses prior/learn/guess/slip .2/.1/.25/.1 without forgetting. The stress scenario cycles skill profiles (.1/.05/.15/.05), (.3/.1/.25/.1), (.5/.15/.35/.2), each with forgetting .03. These are disclosed simulation assumptions, not estimates from real students.

Predictions occur **before** each outcome: training-only constant, within-skill Beta(1,1) frequency, and production BKT. Aggregate held-out measurements:

| Scenario                  | Observations | Constant Brier | Frequency Brier | BKT Brier |
| ------------------------- | -----------: | -------------: | --------------: | --------: |
| Matched, no forgetting    |       17,236 |       0.248917 |        0.218945 |  0.200977 |
| Heterogeneous, forgetting |       17,454 |       0.249959 |        0.214162 |  0.206956 |

Lower Brier error is better for these simulated responses. The first generator intentionally matches BKT, so its advantage is expected and cannot establish general superiority. The report also includes log loss, ten-bin expected calibration error, accuracy, and 1,000 seeded whole-learner bootstrap resamples for Brier/log-loss intervals. A constant predictor can have low aggregate calibration error while poorly distinguishing individual responses; do not rank strategies by that metric alone. Intervals describe sampling variation under these generators, not uncertainty about real learners or fitted parameters.

Practice diagnostics are separate from prediction: assign the original target (baseline), choose prerequisites using three recent successes (rules), or use current BKT readiness. Both adaptive choices call the production prerequisite traversal. Across 2,880 frozen target contexts per cohort, agreement with a disclosed latent-state reference was 29.13%/74.20%/79.10% for baseline/rules/BKT in the matched case and 21.81%/78.33%/80.87% in the stress case. That reference chooses the first unknown prerequisite in the same graph order; it is **not** an optimal teaching policy. Frozen-history choice agreement is not a counterfactual intervention experiment. No classroom efficacy, real-data calibration, or learning improvement is claimed.
