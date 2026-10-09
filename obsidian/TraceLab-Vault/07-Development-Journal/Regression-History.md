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
