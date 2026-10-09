# Shared interface components

`src/fraction-bars.tsx` renders bounded deterministic SVGs from known question operands. Each bar has a textual quantity/partition label and an accessible image description; no uploaded diagram is interpreted. The component is used by the teacher preview and student question workspace, with mobile/axe browser coverage and rendered partition/shading invariants. The rest of the interface still uses native accessible controls and app CSS; this is not a general component library yet.
