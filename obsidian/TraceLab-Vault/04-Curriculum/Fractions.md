# Fractions

Implemented skills: equivalence/reduction, addition, subtraction, multiplication, division and mixed-number addition. Each has two distinct v2 templates, three difficulty ranges, two verified examples, prerequisites, remediation targets and common-error metadata. Missing-numerator equivalence uses x as a placeholder; reduction explicitly requires lowest terms. Addition/subtraction use like or unlike denominators; multiplication/division use a fraction or whole-number operand. Mixed numbers are entered as `(whole + numerator/denominator)` and may finish as an improper fraction.

Generated fractions are positive proper operands; subtraction orders operands to keep its result nonnegative. Divisors are never zero. Exact reference paths and alternative paths are preserved with parameters/version. The verifier accepts supported equivalent alternatives without claiming an unshown rule was proved. A reduced-fraction completion requirement distinguishes value-preserving but unfinished work from an incorrect step; legacy reduction snapshots receive the same requirement on new evaluations, while historical results remain unchanged.

Known deterministic SVG fraction bars show actual operands, equal partition counts and shaded numerators. Mixed-number diagrams explicitly show fractional parts only. Accessible text labels communicate the same quantities without relying on color. Number-line visualizations and negative/more complex word-problem templates remain future work.

Evidence: 12 templates checked over 1,800 generated cases and 11,700 independent SymPy comparisons, zero disagreements. Browser classroom generation/figure/confirmation and mobile axe checks pass. This is mathematical/software evidence, not educator validation or learning gains.

Related: [[Curriculum-Overview]] · [[Misconception-Taxonomy]] · [[Current-State]]
