# Skill Graph

Fraction prerequisites: equivalence → addition → subtraction; equivalence → multiplication → division; addition → mixed-number addition. Algebra: arithmetic expressions → combining like terms and one-step equations; combining/one-step → distribution; one-step → two-step; distribution/two-step → variables on both sides. Unit tests visit the complete graph, reject cycles/missing nodes, verify worked examples and require known remediation targets. Metadata lives in packages/question-bank/src/fractions.ts , algebra.ts and ratios.ts.

The rules-0.2.0 selector validates the complete graph and chooses the first unmet transitive prerequisite in deterministic depth-first order. Classroom-scoped reviewed mastery supplies the ready set; sparse evidence remains insufficient. Statistical calibration remains future work. Generic inequivalence in question-aware grading now points back to the assigned skill, avoiding an unrelated algebra recommendation for a fraction error. Recognized patterns retain their specific skill target.

Related: [[Adaptive-Learning-Engine]] · [[Current-State]] · [[00-START-HERE]]

Ratio prerequisites connect fraction division to unit rates; fraction equivalence and one-step equations to equivalent ratios; both feed proportional scaling and solving proportions. Percent part/whole depends on multiplication and one-step equations; percent change depends on part/whole. All edges are checked for known nodes and cycles.

Geometry connects fraction multiplication to rectangle area, arithmetic to perimeter, area/division to triangle area, area/subtraction to composite area, area/perimeter/division to missing lengths, and area/equivalent ratios to square-unit conversion. A complete-graph regression now traverses every published skill and validates remediation targets.
