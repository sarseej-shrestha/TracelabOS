# Regression History

BUILD-001: Next route and page imports traversed one parent directory too far. Typecheck/build reported unresolved packages. Corrected relative paths; strict typecheck and production build then passed.

BUILD-002: Next created a default app tsconfig with an older target and without allowImportingTsExtensions. Root typecheck passed while Next build failed. Root cause: app configuration did not inherit monorepo settings. Added apps/web/tsconfig.json extending the root strict ES2022 config; build passed.

INSTALL-001: offline npm peer resolution crashed and a transitive pure-rand tarball was absent. Used the documented legacy-peer-deps bootstrap, pinned the cached compatible pure-rand version, and verified installation. No online security audit was possible.

Related: [[00-START-HERE]] · [[Current-State]]

MATH-001: Review identified two fraction-classifier failures. The observed affine coefficient was ignored when matching a denominator-addition candidate, and a zero candidate denominator raised an exception before generic inequivalence could be reported. Added two explicit failing-case regressions, required a constant observation and nonzero candidate denominator, and reran the full suite successfully (358 tests). See [[Change-Ledger]] TASK-0005.

## Browser origin mismatch — 2026-10-08

First real Chromium run failed all three original tests: demo POST was rejected with origin required. Baseline 839d634 used the internal request URL as sole CSRF origin; Next normalized its hostname differently from the browser. Reproduced through the real production server, then added explicit configured public origins and three security regressions (accepted external HTTPS origin, forged forwarded host rejected, internal origin rejected). Session cookies follow the validated public origin. All five browser tests and 361 Vitest tests now pass locally. A test-only select locator timeout was corrected to use its accessible combobox role.

## Workspace contrast and premature scan — 2026-10-08

Integrated Node 22/patched-dependency browser run: four tests passed, workspace axe test failed (paragraph contrast 4.37:1). Baseline CSS muted color inherited against green banner. Explicit darker paragraph color corrects the defect. Browser regression now awaits the actual workspace checkbox; prior passing scans could inspect the preceding assignment screen. CI additionally rejected merged ledger formatting; formatted without relaxing check.

## OCR metric normalization — 2026-10-08

During benchmark review, plain prefix replacement of LaTeX sizing commands also changed leftarrow/rightarrow command names and could conflate directions. Added negative-equivalence regressions and restricted normalization to complete sizing commands. Reran pix2tex with corrected scoring before publishing. This fixes measurement fidelity, not model recognition errors.

## 2026-10-09 — Import rejected digit-bearing identifiers

Adding an OCR provenance import regression exposed `Unexpected source schema`: the existing column validator rejected `sha256` and new `image_sha256`. The PostgreSQL importer originated in d673447 before R2 added the digit-bearing field. It now permits digits after a valid identifier start while retaining a restricted alphabet. The regression imports an existing image reference and compares every field; transactional failures preserved the source and destination. Related: [[Change-Ledger]].

## 2026-10-09 — Simplification completion and reference exposure

Baseline math completion accepted any terminal equivalent fraction, so restating an unreduced simplification problem was marked complete. The fraction curriculum now applies a separate reduced-fraction requirement to new and legacy reduction questions; valid-but-unfinished work retains its valid steps and receives a completion hint. Original saved evaluations are preserved. Unit and dual-database API regressions exercise this behavior.

The question-preview route previously returned references to any authenticated role even though assignment responses hid them. Preview now requires the teacher role, and the new alternative-path field is also withheld from student assignment responses. Dual-database authorization tests cover both boundaries. The source paths originate in the baseline import; the changes are scoped to the fraction task's completion and preview contracts.

2026-10-09, TASK-0021A pre-commit test failure: the first quantity parser treated a denominator's attached unit as a later multiplication, so 3cm / 2cm gained square dimensions. Root cause was using ordinary left-associative product parsing without binding measured literals. Numeric quantities now bind their unit as one operand; explicit fractions with units are measured literals. Retained tests verify cancellation, fractions, mixed-unit quotients and equality annotation provenance. All 58 focused tests and the full 1,141-test suite pass. No incorrect version was pushed.

2026-10-09, TASK-0021C: student assignment responses exposed generated x through parameters. git blame identified baseline 839d634 whole-question spreading; fd5f584 removed alternativePaths but did not address other internal fields. Added a regression that failed on SQLite and PostgreSQL with parameters {a:3,b:2,x:7}, then replaced the student response with an explicit allowlist and typed display contract. The regression also inserts a future internal field and verifies it remains private, while teacher JSON and stored snapshots remain unchanged. Full verification after fix: 1,385 tests, thirteen Chromium workflows, typecheck/lint/build. No database migration or source deletion was required.
