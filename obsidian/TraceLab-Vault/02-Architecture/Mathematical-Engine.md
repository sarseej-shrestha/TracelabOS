# Mathematical Engine

The parser constructs a typed AST for numbers, x, unary negation, arithmetic, parentheses, and equations. Rational values use reduced BigInt numerator/denominator pairs. Normalization produces affine coefficients a*x+b. Expressions compare coefficients; nondegenerate linear equations compare exact solutions. Variable denominators, nonlinear products, identities, and inconsistent equations require review. Missing-step transformations establish only supported equivalence, not proof of an unshown operation. First-error provenance follows consecutive lines, preserving uncertainty after unsupported input.

Related: [[00-START-HERE]] · [[Current-State]]

Engine 0.2.0 adds explicit fraction misconception patterns with valid/unsupported counterexamples. A question-aware completion layer (`:completion-1` in evaluation provenance) preserves the equivalence result while requiring lowest terms for simplification questions. An equivalent unreduced fraction stays valid but incomplete, with an explanation. Historical evaluations are never silently rewritten. Generic errors retain the question's skill context. See [[Fractions]] and [[Math-Engine-Results]].

The question-aware completion layer is now `completion-2`: fraction reduction still requires lowest terms, and affine simplification additionally requires collected terms. This does not change the exact equivalence decision or claim a skipped operation was shown. Existing evaluation versions remain immutable. The independent curriculum oracle now checks both expression equivalence and unique equation solutions with a restricted AST visitor; its own five regression tests check operation order, exact signed fractions, rejected nodes and goal-type distinctions.

Engine 0.3.0 adds a narrowly scoped positive-proportion domain selected by immutable server-generated question metadata. It checks x > 0, clears a single bare-variable denominator in flat ratios, and records conditions in the evaluation. Other variable denominators remain unsupported. Original input and prior evaluation versions are preserved. See [[Ratios-and-Proportions]].
