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

## Replay panel contrast during TASK-0023A

The new pale replay-summary background inherited the global muted paragraph color from the baseline stylesheet. Desktop classroom and mobile replay axe assertions reproduced a 4.41:1 contrast ratio, below the 4.5:1 target. Git diff/blame located the interaction between the new panel background and the existing paragraph rule. The scoped replay/warning paragraph rule now uses the existing dark ink token. The same accessibility assertions are retained and rerun; this was found before the feature commit or merge. See artifacts/classroom-replay-verification.log for the failed run and subsequent result.

## Hosted browser deadline — 2026-10-11

Run 38155822011: after API version 3/Worker d52154f5-74fc-41ec-91fd-1da99ba85932 deployed from eb816f0, four public tests passed and the classroom test exceeded 90 seconds. A finally-block context-close error masked the waiting action. No failing application assertion was identified in the retained JSON; the root cause of the deadline is still unknown. Local public reproduction passes in 13.7 seconds. Test diagnostics now name each phase, apply 15-second operation bounds and preserve the primary failure while closing both contexts. The overall 90-second deadline remains unchanged. Record subsequent CI results separately; a passing rerun alone does not establish the original cause.

## Release propagation gate — TASK-0030

Automatic run 38177734175 published API version 5 and Worker f6d45cad-76fa-4509-8497-de334b2943d2. At 2026-10-11 21:49:28 UTC, CI saw API b42e065 but Worker 49c10be and failed before browser tests. A separate DFW public probe at 21:50:08 UTC saw both b42e065. This shows transient version skew at the original probe, not a measured global propagation duration. Original evidence is retained in artifacts/cloud-propagation-delay.json. The old script checked only once immediately after publication.

The corrected gate polls the fixed public health endpoint for at most 90 seconds/18 requests, with at most ten seconds per request and five-second spacing. It still requires HTTP 200, healthy Neon PostgreSQL/private Neon storage and both exact selected SHAs. Redirects are rejected, response bodies limited to 16 KiB, and an overdue success cannot pass. Reports retain only validated operational fields, HTTP status, safe error categories, elapsed time and valid SHA values; arbitrary response bodies/errors are excluded. No provider deploy is retried by polling.

A second defect was confirmed by downloading the failed run's artifact: it contained the older 21:36 success report for 49c10be because the assertion failed before writing new evidence. Both cloud workflows now remove inherited reports immediately after checkout. The smoke also clears its old report and writes actual failed-attempt evidence before returning nonzero. A skipped browser step therefore supplies no report for the new run.

Fifteen new regression cases cover immediate success, API/Worker skew, permanent mismatch, unhealthy/public persistence, HTTP/network/JSON failures, response-size limits, overdue responses, safe diagnostics and malformed selected SHAs. All 1,617 tests on the fix branch pass; typecheck/lint pass. A new live probe on 2026-10-12 at 03:32 UTC verifies both b42e065 in one request (2.206s). This is current-health verification, not post-upload propagation measurement. Checked rollout remains pending. Quota feature 2304080 is preserved separately and not yet deployed.

## Public mobile confirmation assertion — 2026-10-12

Automatic run 38201268694 applied migration 0006 and verified both ed703c3 services. Four public tests passed; mobile confirmation failed waiting 15 seconds for the correct-result heading. The original report has no request-status annotations, so no HTTP cause is established. Preserved as artifacts/cloud-mobile-confirmation-failure.json. Read-only counters are well below budget ceilings. Full local Chromium reproduction passes 5/5 in 30.3s against unchanged production. Added bounded, fixed-label status diagnostics to the guided and classroom workflows; never records URLs, IDs, headers, request/response bodies or credentials. This is investigation instrumentation, not a claimed application fix.

## Delayed Neon API activation — 2026-10-12

Run 38225838986 uploaded API 8 and Worker abd39842-b8a5-4afe-bffd-8109e50b5b2e. The exact-release gate observed old API ed703c3/new Worker 8f4bd6f on all 18 probes (88.869s), correctly failed, and skipped browser acceptance. Direct authenticated API reads initially agreed. Control plane reported deployment 8 active/completed. Later direct read at 08:57:52.733Z returned 8f4bd6f. Provider lifecycle internals and exact global propagation duration remain unknown; no timeout was increased. Preserve artifacts/cloud-stale-api-release.json and cloud-stale-api-control-plane.json. A separate artifact hardening compiles the source SHA, hashes the entry bundle and requires clean matching artifact/source/runtime identities; it does not claim to fix provider propagation.
