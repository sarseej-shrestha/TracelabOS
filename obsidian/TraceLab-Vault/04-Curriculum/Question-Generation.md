# Question Generation

A bounded integer seed initializes an explicit LCG. Skill, difficulty, seed, parameters, template ID, and template version are stored in each question snapshot. Three difficulty levels adjust coefficient ranges. Generation is deterministic; reference steps are checked in tests across edge seeds and all implemented skill/difficulty combinations. Do not use random generation without preserving its parameters.

Related: [[00-START-HERE]] · [[Current-State]]

Fraction templates use v2.0.0: seed parity selects one of two distinct structures, and a bounded LCG supplies the recorded operands. The snapshot includes answer-form requirements, explanations, alternate paths and data-only figure operands. Teacher preview includes reference/alternate paths; student assignment responses omit them, and the preview endpoint is teacher-only. The original generator remains exported as generateLegacyQuestion for reproducibility of v1 records. Numeric equivalence is checked separately from the reduced-fraction completion criterion.

Algebra v2 adds twelve templates and known expression/equation figure data. `answerForm=simplified-affine` checks a collected expression independently of equation-solving completion. Both unit families include independently verified alternate paths. `generateLegacyQuestion` still reproduces v1 snapshots, and the fixed public-demo question remains unchanged. Current active count: 24 templates over 12 skills.
