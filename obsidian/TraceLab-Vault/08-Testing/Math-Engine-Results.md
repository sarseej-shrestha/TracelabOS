# Math Engine Results

Vitest covers the requested distribution/error-propagation example, equivalent alternative paths, independent errors, denominator addition, unknown-domain barriers, and unfinished solutions. Parameterized question tests validate reference paths. Property cases use fixed seeds and exact arithmetic. This evidence does not establish 95% first-error precision on student work: a held-out labeled supported-domain benchmark is still needed. Independent oracle results are recorded separately from test counts.

Related: [[00-START-HERE]] · [[Current-State]]

Independent run: Python 3.13.9 / SymPy 1.14.0, 2,000 generated cases and 6,000 comparisons, zero disagreements. Python Fraction independently agrees on all rational sums. The oracle covers generated linear endpoints and rational sums, not all parser shapes or real student misconceptions. Reproduce using npm run oracle:vectors and research/symbolic-oracle/verify.py.

## 2026-10-09 fraction expansion

655 TypeScript tests pass, including existing 5,000 seeded property cases, template/reference/alternate-path checks, SVG operand invariants, fraction misconception counterexamples and legacy simplification completion. New independent oracle: 1,800 cases over all 12 fraction templates, 11,700 expression/path comparisons, zero disagreements. Existing SymPy oracle repeated 2,000 cases/6,000 comparisons with zero disagreements. Reports/vectors are in artifacts/fraction-oracle-results.json and fraction-oracle-vectors.json. The new oracle uses a restricted AST visitor and independent SymPy arithmetic/solving; it never evaluates uploaded strings. No first-error precision claim is derived from these generated correctness checks.

Algebra expansion: 1,800 cases over 12 new templates, 11,400 independent comparisons, zero disagreements. The completion layer accepts collected equivalent expressions and rejects uncombined forms without mislabeling their valid steps. Unit examples cover cancellation to constants, negative coefficients, reverse solved equations, identities and nonlinear review. This remains generated-domain evidence; labeled first-error precision on student work is not measured.

Ratio expansion: 1,800 cases / twelve templates / 11,850 SymPy comparisons, zero disagreements. Added 2,000 seeded denominator-clearing and perturbed-solution cases. Unsupported rational functions, zero/nonpositive solutions and identities retain review; original text and domain conditions survive SQLite/PostgreSQL grading. A new test initially expected REQUIRES_REVIEW after an identity; inspection confirmed the established engine uses AMBIGUOUS when the predecessor is degenerate. The test now explicitly checks that contract and still requires incomplete/review status. No production behavior was weakened.

Dimensional verifier: 58 focused tests and 1,000 seeded conversion/counterexample cases; 2,000 independent SymPy metric product/quotient/sum/perimeter cases, zero disagreements. Full suite: 1,141 tests. This component is not yet integrated into geometry assignment generation.
