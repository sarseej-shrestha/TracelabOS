# Reviewed mastery experiments

The application persists one evidence item per reviewed submission, scoped to classroom/student/skill. Corrected reviews replace that item; `requires_review` retracts it. Original reviews and automatic evaluations remain immutable. Replaying evidence in original attempt order produces `bkt-reviewed-1` estimates and an evidence count. The model has provisional, unfitted parameters: prior .2, learning .1, guess .25, slip .1; no forgetting or difficulty effect. At least three observations and .85 probability are required to suggest further variations. These are product heuristics, not validated cutoffs.

Standard BKT recurrence follows the definitions in [Badrinath, Wang and Pardos (2021)](https://educationaldatamining.org/EDM2021/virtual/static/pdf/EDM21_paper_237.pdf). Each response updates the belief using Bayes' rule, then applies a learning transition. Our independent Python check propagates known/unknown state mass with 50-digit Decimal arithmetic. It is an arithmetic check, not a fit or efficacy experiment.

```sh
pnpm oracle:mastery
python3 research/adaptive-evaluation/verify.py
python3 -m unittest discover -s research/adaptive-evaluation -p 'test_*.py'
```

Measured: all 2,047 binary sequences of lengths 0–10 agree within 1e-12; maximum absolute difference 1.099120794378905e-14. Four Python unit tests pass. TypeScript also tests 1,000 seeded longer sequences, invalid parameters, extreme success histories and prerequisite graph safety. Reports are in `artifacts/mastery-oracle-{vectors,results}.json`.

A smoothed success baseline and model entropy are calculated for experiments. Entropy describes this model's belief, not parameter uncertainty or a calibrated confidence interval. A reproducible held-out synthetic strategy comparison, historical-evidence backfill and actual remediation delivery remain separate tasks. There is no real student dataset or demonstrated learning gain.
