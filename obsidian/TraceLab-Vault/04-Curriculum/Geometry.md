# Geometry

The dimensional verifier is implemented in packages/math-engine/src/quantities.ts. Geometry skills are not yet published: rectangle area/perimeter, triangle area, composite figures, missing lengths and unit-conversion templates/figures are the next task. All figures will be generated from known dimensions; arbitrary student sketches are not interpreted.

The verifier supports exact metric quantities in mm, cm and m, with length/square dimensions and cubic-unit counterexamples. Arithmetic combines dimensions, requires matching dimensions for addition/subtraction, converts scales exactly and checks numerical equalities. Variable symbols, general formulas, other units, malformed and undefined operations need review. Each measured literal binds as one operand: 3cm / 2cm is dimensionless. Parentheses make compound quantity denominators explicit. A fraction directly followed by a unit (3/2 cm²) is one measured literal.

Unannotated numerical intermediate lines explicitly inherit the requested answer unit. Annotated units are always checked; they are never stripped. The final answer needs a simplified number/fraction and a compatible unit. Original lines, first-error provenance, propagated mistakes and uncertainty barriers are retained. This convention supports numerical geometry work; it is not a general symbolic dimensional algebra engine.

Verification: 58 focused tests, 1,000 seeded conversion/counterexample cases, and 2,000 independent SymPy parameter-derived quantity cases with zero disagreements. Initial tests caught denominator-unit binding; the parser was corrected before commit and the regression remains. Evidence: artifacts/quantity-oracle-results.json, quantity-oracle-vectors.json and quantity-verification.log.

Related: [[Mathematical-Engine]] · [[Math-Engine-Results]] · [[Current-State]]
