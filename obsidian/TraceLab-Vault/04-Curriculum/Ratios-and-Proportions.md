# Ratios and Proportions

Six implemented skills have two v2.0.0 templates each: unit rates (price/speed), equivalent ratios (missing numerator/denominator), proportional scaling (missing input/output), solving proportions, percent part/whole and percent increase/decrease. All have two worked examples, explicit prerequisite/remediation metadata, three difficulty ranges, immutable generation parameters, reference paths and alternatives. Numeric unit-rate responses use units fixed in the prompt; arbitrary unit text is not parsed.

Known quantities appear in accessible ratio tables. Proportional paint-coverage questions use deterministic SVG double number lines with scale-proportional positions; unknown values remain x. Figures do not supply reference answers to students.

Engine 0.3.0 supports a server-authored `positive-proportion` domain. A single bare x in a flat quotient can occur in a denominator because x > 0 guarantees it is nonzero. Cross multiplication constructs an affine equation and retains the domain condition in persisted feedback. Original lines are preserved. Repeated variables, variable expressions in denominators, nonlinear products, zero denominators and degenerate equations require review. This is deliberately narrower than a general rational-function solver. Missing steps prove supported equivalence, not an unshown operation.

Observed wrong-value patterns cover inverse rates, additive scaling, incorrect cross products, percent multipliers and reporting the change instead of the total. Classifiers apply only to a first error directly following the original problem and describe matches rather than inventing the student's reasoning. Generic errors retain the assigned skill.

Verification: 1,800 generated cases / twelve templates / 11,850 independent SymPy comparisons, zero disagreements; 2,000 additional seeded denominator-clearing property cases; dual-database confirmation/provenance tests. Evidence: artifacts/ratio-oracle-results.json and ratio-oracle-vectors.json. No student-outcome or first-error precision claim follows from generated cases.

Related: [[Curriculum-Overview]] · [[Mathematical-Engine]] · [[Educational-Standards]] · [[Current-State]]
