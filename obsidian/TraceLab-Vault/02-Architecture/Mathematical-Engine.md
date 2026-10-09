# Mathematical Engine

The parser constructs a typed AST for numbers, x, unary negation, arithmetic, parentheses, and equations. Rational values use reduced BigInt numerator/denominator pairs. Normalization produces affine coefficients a*x+b. Expressions compare coefficients; nondegenerate linear equations compare exact solutions. Variable denominators, nonlinear products, identities, and inconsistent equations require review. Missing-step transformations establish only supported equivalence, not proof of an unshown operation. First-error provenance follows consecutive lines, preserving uncertainty after unsupported input.

Related: [[00-START-HERE]] · [[Current-State]]

Engine 0.2.0 adds explicit fraction misconception patterns with valid/unsupported counterexamples. A question-aware completion layer (`:completion-1` in evaluation provenance) preserves the equivalence result while requiring lowest terms for simplification questions. An equivalent unreduced fraction stays valid but incomplete, with an explanation. Historical evaluations are never silently rewritten. Generic errors retain the question's skill context. See [[Fractions]] and [[Math-Engine-Results]].
