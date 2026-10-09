# ADR 0004 Mathematical Verification

Status: accepted bounded implementation. Use custom tokenization/AST and exact BigInt rational affine normalization. Permit one variable x and constant denominators. Reject nonlinear products and variable-denominator transformations for review. Degenerate equations require rule-level review. Matching nondegenerate affine solution sets supports equivalence of written endpoints, not proof of a hidden operation. Preserve first-error provenance and uncertainty barriers; validate independently with SymPy on controlled generated inputs.

Related: [[00-START-HERE]] · [[Current-State]]
