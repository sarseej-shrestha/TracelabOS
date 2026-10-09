# Expressions and Linear Equations

Six skills and twelve v2 templates cover arithmetic operation order, collecting like terms, one-step equations, distribution, two-step equations and variables on both sides. Every skill has two verified examples, standards/prerequisite/remediation metadata, reference and alternative paths, and a known expression/equation SVG. Templates preserve their parameters, seed and version. Original v1 snapshots and the labeled distribution demo are unchanged.

Question-aware completion (`completion-2`) distinguishes simplification from solving. A collected affine expression may finish with one x term and one nonzero constant, or a constant after cancellation. Unexpanded products, repeated x terms, zero terms and factors of one remain valid but unfinished, with an actionable hint. Expression identities written as equations still require review; students enter the simplified expression. Solving templates instead finish with x isolated on either side. Nonlinear expressions, variable denominators, identities and contradictions remain outside automatic approval.

Generated equation coefficients remain nonzero and variables-on-both-sides templates have a unique solution. Challenge variants include negative solutions; one-step multiplication includes exact rational answers. Alternative paths may divide before distribution, reverse the final equality, or collect variables on the opposite side. Missing operations are not inferred from matching solutions.

Evidence: 1,800 algebra cases, 11,400 independent SymPy path comparisons, zero disagreements. Generated/reference/alternative and incomplete-form regressions pass. The student browser can complete a generated expression simplification with accessible known figures. See [[Math-Engine-Results]].

Related: [[Curriculum-Overview]] · [[Mathematical-Engine]] · [[Current-State]]
