# Mathematical Engine

The parser constructs a typed AST for numbers, x, unary negation, arithmetic, parentheses, and equations. Rational values use reduced BigInt numerator/denominator pairs. Normalization produces affine coefficients a*x+b. Expressions compare coefficients; nondegenerate linear equations compare exact solutions. Variable denominators, nonlinear products, identities, and inconsistent equations require review. Missing-step transformations establish only supported equivalence, not proof of an unshown operation. First-error provenance follows consecutive lines, preserving uncertainty after unsupported input.

Related: [[00-START-HERE]] · [[Current-State]]
