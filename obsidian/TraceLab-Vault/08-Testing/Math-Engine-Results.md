# Math Engine Results

Vitest covers the requested distribution/error-propagation example, equivalent alternative paths, independent errors, denominator addition, unknown-domain barriers, and unfinished solutions. Parameterized question tests validate reference paths. Property cases use fixed seeds and exact arithmetic. This evidence does not establish 95% first-error precision on student work: a held-out labeled supported-domain benchmark is still needed. Independent oracle results are recorded separately from test counts.

Related: [[00-START-HERE]] · [[Current-State]]

Independent run: Python 3.13.9 / SymPy 1.14.0, 2,000 generated cases and 6,000 comparisons, zero disagreements. Python Fraction independently agrees on all rational sums. The oracle covers generated linear endpoints and rational sums, not all parser shapes or real student misconceptions. Reproduce using npm run oracle:vectors and research/symbolic-oracle/verify.py.
