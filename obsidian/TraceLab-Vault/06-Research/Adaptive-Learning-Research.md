# Adaptive Learning Research

Source checked 2026-10-09: [pyBKT research paper, Badrinath/Wang/Pardos, EDM 2021](https://educationaldatamining.org/EDM2021/virtual/static/pdf/EDM21_paper_237.pdf). The paper defines prior, learning, guess and slip parameters, Bayesian observation updates and the subsequent learning transition; the standard model assumes no forgetting. TraceLab implements that recurrence directly with explicitly provisional parameters. It does not use the paper's empirical results as evidence for this application.

Independent Python Decimal forward calculation agrees with TypeScript for all 2,047 binary sequences of length zero through ten (maximum absolute difference 1.099120794378905e-14, tolerance 1e-12). Four Python unit tests and 1,000 seeded TypeScript sequence checks pass. See research/adaptive-evaluation and artifacts/mastery-oracle-results.json. This establishes arithmetic agreement only.

No real learning dataset, educator validation or calibrated mastery estimate exists. Future strategy comparisons must freeze synthetic generator assumptions/seeds, separate train/evaluation trajectories and compare prediction metrics and intervention choices against simple baselines. Model entropy is not parameter uncertainty. Do not claim synthetic results show real student-learning gains.

Related: [[Adaptive-Learning-Engine]] · [[Current-State]]
