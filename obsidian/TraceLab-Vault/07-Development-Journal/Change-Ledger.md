# Change Ledger

All tasks below are local work from 2026-10-08. Git metadata writes and shell GitHub access are blocked. Branch names are intended task groupings, **not existing branches**. No commit or push is claimed. These records preserve scope and evidence until source-control permissions are restored; they are not substitutes for Git history.

## TASK-0001

Date: 2026-10-08
Objective: inspect official repository, identity, and bootstrap tooling.
Branch: intended chore/initialize-monorepo; creation blocked.
Commit Hash: none.
Files Changed: README.md, package.json/package-lock.json, pnpm-workspace.yaml, workspace package manifests, tsconfig.json, formatting/lint/Vitest configuration, .env.example, .gitignore, .gitattributes, .npmrc.
Technical Decisions: retain exact official repository; pnpm workspace metadata with tested npm offline bootstrap; pinned cached dependency versions.
Acceptance Criteria: no existing state overwritten; identity inspected; install/typecheck tooling works; Git blockers recorded exactly.
Tests Executed: read-only directory/config/auth/remote inspections; offline dependency installation; strict typecheck and lint.
Test Results: install/typecheck/lint passed. gh credential validation failed under DNS restrictions. git init returned Operation not permitted for .git.
Problems Encountered: read-only .git; GitHub/npm DNS; absent pnpm; npm peer-resolution crash and missing cached transitive version.
Resolution: implement within the writable source tree, record unavailable Git tasks, use tested offline npm fallback. No filesystem/network restriction bypass.
GitHub Push Status: not pushed; no commit exists.
Related Documentation: [[Git-Workflow]], [[Technology-Stack]], [[Recovery-Instructions]].

## TASK-0002

Date: 2026-10-08
Objective: create complete substantive vault and sourced architecture/research records.
Branch: intended docs/create-obsidian-vault; creation blocked.
Commit Hash: none.
Files Changed: obsidian/TraceLab-Vault, docs/architecture, docs/api, docs/deployment, research/*/README.md, scripts/check-vault.py.
Technical Decisions: explicitly distinguish local evidence, future architecture, targets, and blockers; do not select OCR based only on provider descriptions.
Acceptance Criteria: every required note has useful content; wiki links resolve; Current-State has the exact recovery fields; sources are primary and dated.
Tests Executed: wiki-link/substantive-note checker at final checkpoint.
Test Results: 84 substantive notes; all wiki links resolve. Prettier passes. See [[Test-Results]].
Problems Encountered: provider documentation changed (Cloudflare Next.js recommendation, free Queues, Neon storage); direct Neon pages were unsupported by web parser.
Resolution: record current official Cloudflare documentation and Neon official announcement; preserve uncertainty and require provisioning-time recheck.
GitHub Push Status: not pushed; blocked.
Related Documentation: [[References]], [[Hosting-Feasibility]], [[Master-Roadmap]].

## TASK-0003

Date: 2026-10-08
Objective: implement and independently verify bounded deterministic mathematics.
Branch: intended feat/math-ast-parser, then feat/linear-equation-verifier and feat/question-generator; not created.
Commit Hash: none.
Files Changed: packages/math-engine, packages/question-bank, packages/contracts, packages/learning-engine, tests/unit, scripts/oracle-vectors.ts, scripts/benchmark.ts, research/symbolic-oracle.
Technical Decisions: exact reduced BigInt rationals; affine domain; unknown-domain barriers; immutable engine/template versions; conservative recommendation rules.
Acceptance Criteria: requested distribution example yields VALID/FIRST_ERROR/PROPAGATED_ERROR/PROPAGATED_ERROR; fraction references are exact; unsafe domains require review; alternative solutions work; generated solutions agree with an independent oracle.
Tests Executed: parser/state/template tests, 5,000 fixed-seed property cases; 2,000 SymPy oracle cases and 6,000 comparisons; 10,000-run engine benchmark.
Test Results: included in final 358/358 suite; oracle 0 disagreements. Timing evidence is in artifacts/math-benchmark.json and [[Performance-Benchmarks]].
Problems Encountered: no SymPy in the default Python environment; two classifier edge bugs found in review.
Resolution: use an existing read-only SymPy environment for the measured run, document reproducible requirements; fix classifier defects with dedicated regressions (TASK-0005).
GitHub Push Status: not pushed; blocked.
Related Documentation: [[Mathematical-Engine]], [[Math-Engine-Results]], [[ADR-0004-Mathematical-Verification]].

## TASK-0004

Date: 2026-10-08
Objective: build an authenticated persisted manual-transcription vertical slice.
Branch: intended feat/authentication, feat/classroom-management, feat/student-submissions, feat/teacher-dashboard; not created.
Commit Hash: none.
Files Changed: apps/web, services/api, packages/database, packages/vision-adapter, tests/integration, tests/security, tests/e2e, playwright.config.ts, .github/workflows/quality.yml.
Technical Decisions: real local SQLite transactions; private normalized image BLOBs; explicit no-OCR fallback; mandatory confirmation and optimistic versioning; append-only teacher review; no deployment of an unvalidated cloud runtime.
Acceptance Criteria: teacher register/create/publish; student register/enroll/read/submit/confirm; first-error feedback; teacher override preserves automatic result; cross-classroom and cross-origin attacks rejected; data survives reopening; production build succeeds.
Tests Executed: API workflow/authorization/image/session tests; on-disk SQLite persistence and rollback tests; production Next build; attempted Playwright.
Test Results: API/persistence/security tests passed as part of 358/358; build passed. Playwright blocked before assertions by listen EPERM on localhost. No UI/axe pass claimed.
Problems Encountered: incorrect relative import levels; generated Next tsconfig omitted shared strict settings; localhost bind denied.
Resolution: correct imports, extend root app TypeScript config, keep browser verification blocked and preserve ready-to-run tests. No mock OCR substituted.
GitHub Push Status: not pushed; blocked. CI is configured but has not executed on GitHub.
Related Documentation: [[API-Architecture]], [[Database-Architecture]], [[Authentication-Architecture]], [[Accessibility-Testing]], [[Known-Issues]].

## TASK-0005

Date: 2026-10-08
Objective: fix overly broad fraction misconception classification.
Branch: intended fix/fraction-misconception-specificity; not created.
Commit Hash: none.
Files Changed: packages/math-engine/src/index.ts, tests/unit/math.test.ts, regression notes.
Technical Decisions: diagnostic pattern matching must not overrule the independently proven equivalence result.
Acceptance Criteria: x+2/5 following 1/2+1/3 is generic inequivalence, not denominator addition; 1/2+1/(-2) followed by 3 remains FIRST_ERROR, not review due to division by zero inside a diagnostic candidate.
Tests Executed: both explicit regression cases and complete Vitest suite.
Test Results: both regressions pass; full suite 358 passed, 0 failed.
Problems Encountered: classifier compared only the constant coefficient; constructing its hypothetical wrong fraction could itself divide by zero.
Resolution: require a constant observed expression and a nonzero diagnostic denominator before comparing the misconception candidate.
GitHub Push Status: not pushed; blocked.
Related Documentation: [[Regression-History]], [[Misconception-Taxonomy]].

## TASK-0006 — Preserve and reverify the foundation

Date: 2026-10-08 (America/Chicago; archive timestamp 2026-10-09 UTC).
Objective: preserve existing source, diagnose access restrictions, and verify a clean restore before new work.
Branch: none; source-control access remains blocked.
Commit Hash: none. Future import must be ONE honest baseline, not fabricated historical task commits.
Files Changed: recovery/ backup/manifest/verification/runbook files, .gitignore archive exclusion, existing Obsidian recovery/state/ledger/test notes, README recovery pointer. Application, tests, lockfiles, and original evidence preserved.
Technical Decisions: create archive before migration; exclude private data/credentials/dependencies/builds; verify every extracted hash; install from unchanged package-lock; do not retry or bypass explicit Git/socket denials.
Acceptance Criteria: recoverable archive, clean restored checks, exact environment diagnosis, honest Git and browser status, no feature work before baseline/browser gate.
Tests Executed: extraction and 150 per-file hash checks; npm ci offline; npm run verify; format check; vault link check; oracle vectors and SymPy; fresh DNS/local socket probes.
Test Results: archive extraction verified; 84 notes retained; 358 tests passed, 0 failed; 5,000 seeded cases; 6,000 oracle comparisons with zero disagreements; typecheck/lint/format/build passed. Localhost probe returned EPERM, so browser assertions remain unexecuted.
Problems Encountered: active policy marks .git read-only and disables sandbox approvals; DNS fails; no managed worktree/authorized destination exists; gh cannot validate credentials without connectivity.
Resolution: backup and restore rehearsal complete; permission-profile/environment change requested; recovery runbook prepared. Baseline import/push and browser acceptance remain blocked, not completed.
GitHub Push Status: none. Public official repository page still reported empty; authenticated remote/push authorization could not be checked.
Related Documentation: [[Recovery-Instructions]], [[Current-State]], [[Test-Results]], recovery/README.md, recovery/verification/summary.json.

## TASK-0007 — Import the recovered foundation

Date: 2026-10-08. Objective: preserve the existing implementation in one current-time baseline commit. Branch: main. Commit hash/push: pending at preparation; recorded in the following task after remote verification. GitHub identity and verified primary email checked through authenticated APIs. Official remote confirmed empty using git ls-remote. Git initialization and localhost binding succeeded. Source backup checksum reconfirmed. Existing lockfile installs with the verified offline cache; online npm 11 optional-dependency resolution fails and is recorded for a dedicated fix. Baseline checks: see recovery/verification/full-access-baseline.log. No earlier task commits are fabricated.

## TASK-0008 — Browser recovery verification (active)

Date: 2026-10-08. Branch: test/recovery-browser-verification, created from synchronized main. Baseline import 839d63439e9c2d5e3f800592cb68003bf1cec3c9 was pushed to the official repository; local/remote hashes matched and source/vault files were verified through GitHub API. Acceptance: real Chromium demo and authenticated classroom→assignment→photo→confirmation→teacher-review workflows pass, keyboard/mobile/axe checks pass, defects receive regressions, and fixes are pushed/merged after checks. Current execution uses the installed Chromium binary. No browser result claimed until completion.

TASK-0008 local result: 361 unit/integration/security tests and five Chromium E2E tests passed; typecheck/lint/build passed. Added three API security regressions plus complete authenticated two-context classroom test and keyboard/text zoom test. Fixed explicit public origin handling behind Next internal request normalization. Files: API factory, Next route, environment example, security/E2E tests, browser report/screenshots and vault. No live OCR claim; controlled typeset fixture validates upload only. Push/merge pending CI install repair.

## TASK-0009 — Reproducible workspace install

Date: 2026-10-08. Branch: fix/reproducible-workspace-install, from synchronized baseline main. Objective: replace the failing npm optional dependency installation with a pinned pnpm frozen lock on Node 22 LTS. Acceptance: clean online install, format/type/lint/unit/build/oracle checks and CI pass; audited dependency risks addressed. Browser task a2ce11d is pushed separately and awaits this dependency repair. No merge bypasses failed checks.

TASK-0009 results: pnpm 10.28.2 frozen installation succeeded in a clean temporary directory on Node 22.23.3. Next 16.3.8, sharp 0.35.5, Hono 4.13.13 and Vitest 4.1.11 resolve all 17 advisories reported against the initial dependencies; current pnpm audit reports no known vulnerabilities. All 358 tests on this baseline-derived branch, typecheck/lint/format/build passed. Repeated oracle: 2,000 cases, 6,000 comparisons, zero disagreements. pnpm lock is now authoritative; old npm lock preserved in baseline/archive. Browser branch contains three additional origin regressions and will integrate this task before remote CI acceptance.

## TASK-0010 — Workspace text contrast regression

Date: 2026-10-08. Branch: fix/workspace-text-contrast, dependent on unmerged browser recovery. Objective/acceptance: loaded workspace passes WCAG AA axe scan reliably. Reproduced question paragraph contrast 4.37:1 against #e9efe3; previous browser scan could execute before workspace rendered. Darken paragraph to #4b5d55 and wait for confirmation checkbox before scanning. Preserve full checks; do not suppress axe rules. Integrating TASK-0009 also revealed ledger formatting drift; corrected with Prettier. Verification pending final rerun.

TASK-0010 result: formatting, production build and all five Chromium tests passed (5.4 seconds), with workspace axe scan awaiting the rendered view. TASK-0008 integrated test suite passed 361/361 and typecheck/lint before the CSS correction. TASK-0009 commit e5ff9fb and browser commit a2ce11d are pushed; remote oracle CI passed, initial verify CI rejected ledger formatting now fixed. No failing check bypassed.

## TASK-0011 — PostgreSQL persistence

Date: 2026-10-08. Branch: feat/postgresql-persistence, from synchronized main fce835835e3673ed901264ced80e6cddaeb75705. Recovery PR #1 merged after both GitHub checks passed (run 37864780014); remote main hash verified. Objective: integrate asynchronous PostgreSQL into the existing API while preserving local SQLite. Acceptance: real PostgreSQL SQL/migrations, complete existing API workflow on both engines, rollback and concurrent request regressions, explicit DATABASE_URL runtime selection, no unverified hosted claim. PGlite provides local PostgreSQL execution; Docker daemon and cloud credentials are unavailable. New dependencies and runtime limits will be documented.

TASK-0011 local verification: 398 tests pass; typecheck/lint/production build pass; five browser tests pass (5.5s); no known dependency vulnerabilities. Files: async adapter, Neon driver, versioned migration/checksum runner, guarded SQLite importer, existing API handlers/Next runtime selection, shared PostgreSQL API and concurrency/import tests, scripts/env/docs. Decision: request-scoped transactions and bounded global write lock preserve correctness during asynchronous migration; hosted latency/transport remain unverified. Recovery PR #1 merge fce835835e3673ed901264ced80e6cddaeb75705 is on remote main; this feature is pending commit/push/checks.

## TASK-0012 — Private R2 image storage

Date: 2026-10-08. Branch: feat/private-r2-storage, from synchronized main after PR #2 passed both GitHub checks (run 37865456695) and merged. PostgreSQL feature commit d673447 is now preserved remotely. Objective: private R2-backed image upload/retrieval with existing authorization, durable image references and a safe local mode. Acceptance: real S3-compatible adapter, signature/decoding validation before storage, no public image URLs, integrity checks, failure/authorization tests, migration and orphan reconciliation tools, and clear distinction between local transport tests and pending live R2 verification.

TASK-0012 local result: 416 tests pass, zero fail; typecheck/lint/build and five Chromium tests pass; no known dependency vulnerabilities. Added real S3 adapter, immutable references migration, authorization/integrity enforcement, bounded migration/reconciliation tools, local protocol and dual-database integration tests. No live R2 credentials are configured. PostgreSQL PR #2 merge bcc962c01cf6fc406533767e96cc7aafc1ccefcf verified on remote main. Current R2 task commit/push/checks pending.

## TASK-0013 — Actual handwriting OCR pilot

Date: 2026-10-08. Branch: test/ocr-handwriting-benchmark, from synchronized main a70163b530131965bae20bcdbc640d89f10b1de6. R2 PR #3 passed both GitHub checks (run 37868611108) and merged with remote hash verified. Objective: execute actual local model inference on public human handwriting, publish reproducible per-sample results and license/provenance, and reject unsupported accuracy claims. Acceptance: pinned dataset hash/sample selection, deterministic rendering/seed, exact-expression and character-edit metrics, observed latency, model hashes, metric regression tests. MathWriting is CC BY-NC-SA with Wikipedia-derived label terms; samples stay in ignored research data and never become unrestricted production fixtures. Temporary isolated Python environment installed pix2tex 0.1.4; no model is selected for production before results.

TASK-0013 local results: two real inference runs of 72 images each completed; all predictions retained. pix2tex 0/72 exact; Pix2Text-MFR-1.5 3/72. Eighteen Python tests and Ruff checks pass. Dataset SHA-256, model revision/weight hashes, complete environment locks and licensing notices recorded. A scoring normalization bug was caught and corrected with regressions/rerun. Decision: retain Pix2Text as an experimental candidate for mandatory correction, not production approval; targeted photographed-work benchmark remains required. R2 merge a70163b530131965bae20bcdbc640d89f10b1de6 is verified remotely. This research task push/checks pending.

## TASK-0014 — Experimental local OCR adapter

Date: 2026-10-08. Branch: feat/local-ocr-adapter, created from synchronized main and integrating the pending benchmark branch as an explicit dependency. Benchmark commit 7ce8640 is pushed; its Python/oracle checks pass and Chromium installation remains pending. No pending check is bypassed on main. Objective: an authenticated localhost inference service and bounded typed HTTP adapter using the measured Pix2Text candidate. Acceptance: actual model output, computed line regions, no fabricated confidence, invalid/oversized/unauthorized inputs rejected, tested conservative LaTeX conversion, no clipboard side effects and no automatic grading. Integration into durable application jobs follows separately.

TASK-0014 result: 444 TypeScript tests and 24 Python tests pass; strict typecheck/lint, Python Ruff and production build pass. Authenticated real-model HTTP smoke passes: unauthorized 401, authorized typed extraction with measured bounding box; artifact records actual duration and states gradingPerformed=false. Added experimental Python service, bounded HTTP adapter, conservative LaTeX conversion, metric/region tests and reproducible smoke command. No production accuracy approval or application job integration claimed. Benchmark PR #4 merged after all three checks passed; remote main c6bf708fa08e3a439cf2769dee81d409bf51a39a verified. This adapter feature push/CI pending.

## TASK-0016 — Import identifier regression

Date: 2026-10-09. Branch: fix/import-column-identifiers, from main 4f62794fe4b2c28a48a1d769daee21eb1cb8c0b7. TASK-0015 queue work is preserved in a named Git stash while this independent regression is fixed. Objective/acceptance: import existing image references without rejecting sha256, preserve SQL identifier validation, regression on actual PostgreSQL. Root cause: importer whitelist allowed only letters/underscore, but R2 migration introduced sha256. Git inspection locates original validator in PostgreSQL feature d673447; no records were lost because import rolls back. Verification pending.

TASK-0016 result: the PostgreSQL import regression passes; typecheck, ESLint and changed-file formatting pass. Source/destination image references compare equal and the existing populated-target rejection remains tested. Files changed: importer, import regression and journal. Push/CI follows this verified fix.

## TASK-0015 — Durable submission OCR jobs

Date: 2026-10-09. Branch: feat/ocr-submission-jobs, from synchronized main 4f62794fe4b2c28a48a1d769daee21eb1cb8c0b7. Adapter PR #5 passed all three checks (run 37870333210), merged and remote main verified. Objective: bounded durable OCR with retries, cancellation, preserved raw output and mandatory confirmation. Acceptance: dual-database migration and queue tests; authorization/idempotency/quotas; expired lease recovery and stale-result rejection; no inference inside a write transaction; original output retained alongside student edits; reproducible worker command. UI integration follows as its own task. Verification pending.

TASK-0015 result: 470 tests pass, including 26 queue tests on both databases; typecheck, lint, production build and five browser tests pass (5.4s). Actual local-model API workflow passed with original OCR ungraded, deliberate student correction, explicit confirmation and teacher review; measured worker duration 100.57ms. Files: migration 0003/local upgrade/importer, queue and API routes, worker/smoke commands, runtime configuration, integration regressions and docs/evidence. Importer regression was fixed independently as 88487d7, PR #6 merged after run 37893009288 passed. Current task commit/push/CI follows verification. Browser extraction controls remain a separate task.

## TASK-0017 — OCR transcription workspace

Date: 2026-10-09. Branch: feat/ocr-transcription-workspace, from synchronized main after PR #7 passed run 37893284667 and merged; durable queue commit 8893999 is preserved remotely. Objective: extraction controls, polling, cancellation/manual fallback and original-output review in the actual student/teacher UI. Acceptance: existing browser flows remain functional; repeatable real-browser tests exercise persisted worker/provider boundary with a clearly labeled deterministic provider fixture; no grading before confirmation; saved drafts survive cancellation; extraction failure is recoverable; original recognition remains visible after edits. Actual-model integration was independently measured in TASK-0015; browser fixtures are not accuracy evidence.

TASK-0017 result: 470 TypeScript tests and all eight Chromium tests pass (latest 12.2s); typecheck, ESLint, formatting and production build pass. Added three browser workflows and an isolated real-worker/controlled-provider harness; expanded workspace axe check passes. Separate actual-model Chromium smoke passed in 1465.52ms and records original output ungraded before deliberate correction and confirmation. Files: workspace/status/provenance controls and styling, browser config/fixture/tests/smoke, reports/screenshots, README/vault/roadmap. No recognition-accuracy claim. PR #7 merge 3319e45a8651bba4b0d20cfc9b7cceba10ee3623 verified remotely. UI commit/push/checks follow this verification.

## TASK-0018 — Fraction curriculum expansion

Date: 2026-10-09. Branch: feat/fraction-curriculum, from synchronized main after PR #8 passed all checks (run 37893988907) and merged. UI commit 8742c97 is preserved remotely. Objective: six fraction skills with two distinct parameterized templates each, worked examples, prerequisite/remediation metadata and deterministic accessible fraction figures. Acceptance: generated reference/alternative paths verify across seeds/difficulties; denominator safety; versioned template parameters; figures match operands; teacher/student pages render figures; curriculum browser regression; clear standards references and unsupported-domain limits. Existing algebra templates and saved assignments remain usable. Simplification completion must be checked explicitly rather than treating any equivalent unreduced fraction as finished.

TASK-0018 local result: 655 TypeScript tests, nine Chromium workflows (14.4s), typecheck/lint/build pass. Fraction oracle: 1,800 cases/11,700 comparisons; existing oracle: 2,000/6,000; zero disagreements. Added v2 templates, known SVG figures, question completion/provenance, specific fraction rules, preview authorization, generated/dual-database/browser tests and restricted-AST Python oracle. Fixed local Python module-name collision before accepting results. Standards reviewed from the official PDF; no educator endorsement claimed. Eight skills/fourteen active templates are the actual total, not the final target. Push/checks/merge pending.

## TASK-0019 — Algebra curriculum expansion

Date: 2026-10-09. Branch: feat/algebra-curriculum, from synchronized main after fraction PR #9 passed run 37923791853 and merged. Fraction commit fd5f584 and all generated/browser/oracle evidence are preserved remotely. Objective: six algebra skills/twelve distinct templates with known figures, alternate paths and explicit simplification/solution completion. Acceptance: preserve legacy snapshots, reject incomplete combining/distribution as finished, verify generated equations/expressions independently, exercise teacher/student browser flows and keep nonlinear/domain-unsafe work in review. Expected combined curriculum total after verification: twelve skills/twenty-four active templates, not full four-unit coverage.

TASK-0019 local result: 827 TypeScript tests, ten Chromium workflows (15.0s), typecheck/lint/build and five oracle unittest cases pass. Algebra oracle: 1,800 cases/11,400 comparisons; fraction oracle: 1,800/11,700; zero disagreements. Added six algebra skills/twelve templates, known structure figures, question-specific affine completion, alternate paths, dual-database and browser regressions, and independent expression/equation checks in CI. Combined active curriculum: twelve skills/twenty-four templates. Fraction PR #9 merged as d1259744df3e86a0da2c7a13b882381b139abd39 after run 37923791853 passed. Algebra commit/push/checks pending.

TASK-0019 remote verification: feature 572ceec passed all three checks in run 37990594913; PR #10 merged.

## TASK-0020 — Ratios and proportions

Date: 2026-10-09. Branch: feat/ratio-curriculum, from synchronized main after PR #10. Objective: six ratio/rate/percent skills with twelve deterministic templates, figures and explicit domain checks. Acceptance: positive-proportion denominator safety, no silent acceptance of unsupported rational equations, reference/alternative and misconception tests, dual-database API and browser coverage, independent SymPy comparisons, updated curriculum and recovery evidence. Implementation and verification pending.

TASK-0020 local result: 1,083 Vitest tests including 7,000 seeded property cases, eleven Chromium workflows (16.1s), typecheck/lint/build and five Python oracle unit tests passed. Ratio SymPy: 1,800 cases/11,850 comparisons, zero disagreements. Files: math domain checks, ratio generation/classification, figures, grading UI, dual-database/browser/property tests, oracle vectors/results/CI and curriculum documentation. A test expectation was corrected to explicitly preserve existing AMBIGUOUS behavior after degenerate equations; no failing product behavior was bypassed. Engine 0.3.0 retains original input, explicit conditions and historical evaluation versions. Push and merge pending. Algebra merge verified remotely: a59b1ad70cc9e98dae2e98b01a54b4b194a8d270.

TASK-0020 remote result: 3c38f88 pushed; PR #11 passed all checks in run 37991449649 and merged.

## TASK-0021A — Dimensional quantity verifier

Date: 2026-10-09. Branch: feat/geometry-unit-verifier, from synchronized main after PR #11. Objective: exact bounded metric quantity parsing and step verification for geometry. Acceptance: preserve linear/square dimensions, convert metric scale exactly, reject incompatible addition/undefined operations, preserve first-error/propagation and review barriers, require a final explicit unit, retain original lines, and verify with seeded independent arithmetic tests. Geometry templates/UI integration follow separately; no exposed geometry skill is claimed yet.

TASK-0021A local result: 58 focused/1,141 total Vitest tests, typecheck and ESLint passed; 1,000 seeded dimensional cases and 2,000 independent SymPy quantity cases passed. Initial denominator-unit binding failure fixed with a retained regression; no test weakened. Added bounded metric parser/evaluator, test/oracle scripts, CI evidence and geometry boundary documentation. Ratio PR #11 remote main verified as 7cd2bd3a971285eb0bf6eab726229e1927b295c7. Quantity feature commit/push/checks pending; geometry UI/templates remain TASK-0021B.

TASK-0021A remote result: feature 434ebb9 pushed to the official repository. PR #12 passed verify/oracle/ocr-metrics in run 37992150994, then merged as 0113e1ca334621d8db131fc7a61ef7412ea2d3b2. Remote main hash verified. All earlier-domain and browser/build gates passed again.

## CHECKPOINT-20261009-CURRICULUM

Date: 2026-10-09. Branch: docs/curriculum-recovery-checkpoint. Objective: record completed PRs #10–#12 and exact next geometry task. Files: Current-State, Change-Ledger, Task-Backlog, roadmap, recovery/testing notes. Decisions: preserve the original immutable recovery archive and distinguish verified standalone unit logic from pending geometry UI/templates. Verification: archive SHA-256 unchanged; running preview HTTP 200 and guided-demo control visible in Chromium; all code checks passed in run 37992150994. Known blockers: cloud credentials absent; camera-photograph OCR accuracy and hosted deployment still unverified. GitHub code push status: verified through PR #12; this documentation checkpoint follows the ordinary checked PR workflow. Its commit hash can be recovered with git log --grep='record verified curriculum recovery checkpoint'.

Checkpoint documentation 471bf22 passed all checks in run 37992489130; PR #13 merged and remote main synchronized.

## TASK-0021B — Geometry curriculum integration

Date: 2026-10-09. Branch: feat/geometry-curriculum. Objective: connect dimensional grading to six geometry skills/twelve templates, known SVG figures, worked/alternative solutions and misconception feedback. Acceptance: correct length/area units and conversions; unchanged old snapshots; verified reference/alternative paths; no silent grading of unsupported formulas; dual-database/browser workflows and independent parameter-derived oracle. Tests and implementation pending.

TASK-0021B local result: 1,383 Vitest tests, strict typecheck, ESLint and production build pass. Thirteen Chromium workflows pass (16.9s), including mobile composite figures, unit errors and immutable teacher-review history. Geometry oracle: 1,800 cases/twelve templates/10,800 comparisons, zero disagreements. Ten Python oracle unit tests pass. Initial browser locator matched both saved review and its editable textarea; it now selects the saved paragraph explicitly, without weakening the provenance assertion. Files: geometry generation/classification, trusted answerUnit grading, SVG renderer, numerical-entry guidance, API/browser/unit tests, independent dimensional oracle and evidence/docs. Discovered baseline serializer exposes student generation parameters; recorded in Known-Issues for a separate security fix after this feature merge. Commit/push/checks pending.

TASK-0021B formatting correction: feature daa6111 was pushed after a final formatting check reported an unformatted browser locator; the shell sequence did not stop after that command. No merge occurred. Applied Prettier to the locator, repeated the full formatting check successfully, and changed subsequent verification/commit sequences to fail fast. CI must pass on the corrective commit before merge.

TASK-0021B remote result: daa6111 and formatting correction 570fe9a are preserved. PR #14 passed all checks in run 38016555988, merged and remote main synchronized.

## TASK-0021C — Student question projection

Date: 2026-10-09 America/Chicago. Branch: security/student-question-projection. Objective: remove answer-bearing/internal generation metadata from student assignment responses without modifying stored question snapshots or teacher access. Root cause: baseline 839d634 spread the whole Question into responses and removed only reference; fd5f584 additionally removed alternativePaths, leaving parameters and future fields exposed. Acceptance: failing regression on both databases, explicit field projection, preserved unit/figure data, unchanged teacher/server provenance, complete API/browser verification. No cross-classroom data exposure is implied by this finding.

TASK-0021C local result: reproduced two failing database cases before the fix; afterward 1,385 Vitest tests, strict TypeScript, ESLint and production build pass. Thirteen Chromium workflows pass (17.3s). Changed student serializer and shared display type; saved teacher/server question snapshots are unchanged. Added future-field and provenance regressions. Geometry merge e7b20a03bb195c88a276fa586a0954293ff60714 is verified remotely. Security commit/push/checks pending.

TASK-0021C remote result: a6727d3 passed verify/oracle/ocr-metrics in run 38016980633. PR #15 merged as 53a13d8fe43472d74a1573d2947a28a909af75f8; remote main verified.

## TASK-0022A — Reviewed mastery persistence

Date: 2026-10-09. Branch: feat/reviewed-mastery, from synchronized main after PR #15. Objective: classroom-scoped, versioned mastery estimates driven only by teacher-reviewed submissions. Acceptance: one evidence row per submission; repeated/corrected reviews replace or retract evidence and deterministically recompute estimates; unconfirmed/automatic-only work never changes mastery; atomic persistence on SQLite/PostgreSQL; authorized student/teacher progress views; provisional BKT parameters and evidence counts are explicit; independent recurrence checks and browser regression. Remediation delivery and statistical strategy comparisons follow independently. No calibrated probability or learning improvement is claimed.

TASK-0022A local result (2026-10-10): 1,418 Vitest tests/9,000 seeded property cases, typecheck, lint and build pass; fourteen Chromium workflows pass (18.2s). Independent Decimal oracle: 2,047 sequences, zero disagreements; four Python tests pass. Files: BKT/graph logic, schema migration 0004 and import, transactional API projection, authorized progress/UI, API/browser/migration/property tests, oracle/CI and vault/evidence. Updated stale migration-count test for explicit v4; corrected Python import formatting before final checks. Historical reviews are preserved but not automatically backfilled; parameters are unfitted, and targeted practice/strategy comparisons remain separate. Security a6727d3 is merged via PR #15. Mastery commit/push/checks follow local verification.

TASK-0022A remote result: cbe7ba9 and documentation b0529de passed verify/oracle/ocr-metrics in run 38042298325. PR #16 merged as 1ac6fcadda5af2becf210dac3e2c332200631b5b; remote main verified.

## TASK-0022B — Targeted remediation delivery

Date: 2026-10-10. Branch: feat/targeted-remediation, from synchronized main after PR #16. Objective: teacher-assigned prerequisite practice for the reviewed student, delivered through the actual assignment/submission workflow. Acceptance: one follow-up per source submission despite retries; immutable review/evaluation/recommendation/mastery provenance; stale-review rejection; student-specific listing and submission authorization; no accidental answer disclosure; transaction rollback; migration/import preservation; full browser completion and subsequent teacher review. Historical mastery rebuild and strategy comparisons remain separate tasks.

TASK-0022B local result: 1,433 Vitest tests pass; typecheck/lint/build pass; fifteen Chromium workflows pass (19.6s). Files: schema migration 0005/import, guarded/idempotent API publication, student-specific authorization, teacher/student controls and linked practice explanation, API/migration/import/browser tests, screenshots/logs and vault. No failing test was bypassed. Parameters/curriculum versions and review/mastery provenance are preserved; historical evidence rebuild and strategy experiments remain separate. Commit/push/checks pending.

TASK-0022B remote result: 48581d1 passed all checks in run 38042810482. PR #17 merged as 134237f997bf4d2cd2ccbea26a484e4ecb0e6489; remote main verified.

## TASK-0022C — Historical mastery rebuild

Date: 2026-10-10. Branch: feat/mastery-history-rebuild. Objective: safely project historical latest teacher decisions into the current mastery model. Acceptance: read-only default; aggregate plan with no private records; explicit target; atomic apply; no edits to reviews/evaluations/events/recommendations; old model versions preserved; deterministic attempt order and no-op repeat; malformed/unknown/incomplete evidence blocks application; SQLite/PostgreSQL rollback and actual CLI tests. No new model or efficacy claim.

TASK-0022C local result: 1,452 Vitest tests, typecheck/lint/build pass. Nineteen new dual-database/CLI cases verify read-only planning, historical evaluation selection, deterministic replay, source/old-model preservation, malformed-input rejection and atomic rollback. Actual local demo backup: apps/web/.data/backups/before-mastery-rebuild-20261010T095707Z.db, SHA-256 d9192f7d0ea336c67eaa044d8f77916b87a4e1d7f012e87ab3f92f40fd38ea5a, integrity verified. One historical reviewed attempt backfilled; repeat applied=false; thirteen original tables unchanged and the newly migrated recommendations table empty. Initial manual comparison was adjusted for the pre-v5 backup's absent recommendations table, not a product failure. Local application/provider/worker restarted; Chromium preview and provider health passed. Files: operational projection/CLI, tests, reports and recovery/architecture/operations notes. No credentials or private backup bytes committed. Commit/push/CI follow; strategy comparisons are next.

TASK-0022C remote result: 5dc88b6 passed all checks in run 38043429091. PR #18 merged as 33c0f7295faf13d3e824e9cbd07655dbf9f86cdb; remote main verified.

## TASK-0022D — Reproducible adaptive strategy comparison

Date: 2026-10-10. Branch: research/adaptive-strategy-evaluation. Objective: compare fixed baseline, recent-success rules and current BKT logic on disclosed synthetic trajectories. Acceptance: deterministic generators and learner-disjoint train/test partitions; predictions computed before each outcome; current production BKT/prerequisite logic reused; proper prediction metrics and learner-cluster resampling; separate practice-choice diagnostics against a stated latent-state reference; heterogeneous/forgetting stress case; Python/TypeScript tests and CI reproduction; no real-learning or calibration claims.

TASK-0022D local result: 1,462 Vitest tests; typecheck/lint/build; fifteen Chromium workflows (19.4s); twelve adaptive Python tests pass. Node 22/Python 3.13 reproduce dataset hash 625c844f76d232cb0e074c9dc13bbf2c0cb7674a1c2515d128173251935ff2e4 and scores hash 19f89efffe2f93e0740b5e0fb550d019feb86c997ae11497bcfeb5702d58b61e. Measured 240 held-out synthetic learners, 34,690 predictions, 5,760 practice choices. Files: synthetic generator/scorer/evaluator/tests, shared prerequisite selector, CI artifact/report reproduction, measured report and vault. Model parameters remain provisional; no educational efficacy claim. Rebuild 5dc88b6 is merged via PR #18. Commit/push/CI follow local verification.

TASK-0022D remote result: b67f545 and documentation b07169e passed all checks in run 38061417133. PR #19 merged as 22fb37db3b861a8a29a36ca33539479b104f672d; remote main verified.

## TASK-0022E — Interactive learning experiment view

Date: 2026-10-10. Branch: feat/learning-experiment-view, from synchronized main after PR #19. Objective: expose inspectable model behavior and actual published synthetic comparison in the engineering workspace. Acceptance: production BKT recurrence with fictional local-only outcomes; distinguish knowledge belief from response prediction; bounded add/undo/reset and keyboard operation; scenario selection displays checked-in evidence and limitations; accessible tables and responsive layout; no student data writes; browser regression and build checks. Correct related stale curriculum/engineering copy.

TASK-0022E local result: 1,462 Vitest tests, strict typecheck, lint and production build pass; seventeen Chromium workflows pass (21.1s). New browser tests verify pre-outcome predictions against hand-calculated values, bounded histories, undo/reset/unmount, no API writes, both evidence scenarios, mobile overflow, keyboard control/table focus and desktop/mobile axe. Files: learning-lab component/styles, current curriculum/engineering copy, browser tests/screenshots/log and related vault notes. Initial test discovery failed because Node requires a JSON import attribute; corrected the test import and repeated the full browser suite successfully. No production estimator parameters changed. Commit/push/CI follow.

TASK-0022E remote result: 4d28d18 passed all checks in run 38061858127. PR #20 merged as 7ce5bedf6ac38127ed57a9257892f4101e80519d; remote main verified. Preview/provider health passed at 2026-10-10T15:02:11Z.

## TASK-0023A — Deterministic classroom replay

Date: 2026-10-10. Branch: feat/classroom-event-replay, from synchronized main after PR #20. Objective: reconstruct recorded classroom milestones at a selected event position, with a bounded stable paginated history and honest completeness diagnostics. Acceptance: idempotent duplicate handling, deterministic ordering, conflicting identity rejection, missing-start/unknown/invalid event warnings, no assumption that global sequence gaps imply missing classroom events; teacher-only snapshot pagination and classroom isolation; real browser replay; preserve existing events and current-state views. Live transport remains a separate task.

TASK-0023A local result: 1,510 Vitest tests, strict typecheck, lint and production build pass; eighteen Chromium workflows pass (22.2s). Forty-eight new unit/dual-database cases include 500 seeded reorder/duplicate runs (9,500 property cases total), 100+ event pagination with concurrent appends, owner isolation, private-field projection, malformed cursors and explicit history bounds. Browser replay verifies each manual lifecycle prefix, corrected review decisions, keyboard scrubbing, mobile accessibility and reload. The first browser run found a 4.41:1 panel contrast regression; scoped dark text fixed the root cause and unchanged assertions passed on a complete rerun. Files: pure replay/history modules, API page contract, teacher controls, tests/evidence and vault. No historical events or schema migrations changed. Live transport remains separate; commit/push/CI follow.

TASK-0023A remote result: 06b7026aca0ab744f5176e1dc49572b25427869a passed verify/oracle/ocr-metrics in run 38087349157. PR #21 merged as 25fae5ef16aee1fdf36f4cfd1b1ee0a24664c9df; remote main verified. GitHub contents API returned replay blob 9722a24f1355dd911bbecd9a53b94c9faaa73a7d, matching local Git.

## CHECKPOINT-20261010-REPLAY

Date: 2026-10-10 America/Chicago. Branch: docs/replay-recovery-checkpoint. Objective: reconcile recovery/roadmap notes after checked PRs #19–#21 and preserve preview evidence. Acceptance: correct commit/check results, original archive unchanged, all wiki links valid, precise next task and no hosted/accuracy claims. Files: checkpoint notes, operations/roadmap and artifacts/replay-preview-smoke.json. Verification: 86 vault notes, zero broken wiki links; baseline archive hash unchanged; application HTTP 200/guided-demo visible in Chromium and experimental provider health verified at 2026-10-10T21:22:37Z. No new inference accuracy test. Cloud environment values remain unconfigured. Code verification is preserved in run 38087349157; documentation formatting/checks follow. Commit hash is discoverable with git log --grep='record verified replay recovery checkpoint'.

## TASK-0024A — Existing Neon cloud validation

Date: 2026-10-10. Branch: feat/neon-cloud-validation, from verified remote main 8c5df3c361bae781899322ad31126cfbf9a2d07f. Objective: connect the existing user-provisioned database and verify the current workflow before Worker deployment. Acceptance: inspect schema before migration; apply the five existing checksum-protected migrations; repeat without changes; inspect constraints/indexes; exercise fictional sessions, submission/image authorization, confirmed grading and teacher review; reopen the connection and verify persisted state; retain local SQLite data; record only credential-free evidence. The deployment directive takes priority over TASK-0023B. Initial read-only connection succeeds to PostgreSQL 18.6; public schema has no tables. DATABASE_URL was received through a masked local dialog and saved mode 0600 in an ignored file. Cloudflare and Neon management browser authorization remain pending; no paid service is authorized.

TASK-0024A local result: real Neon workflow passes; five migrations repeat without changes, 34 foreign keys and 41 indexes inspected. The original public schema was empty. Fictional demo records survive fresh connections; unauthorized images/classrooms are denied. First harness attempt failed because role switching revoked a reused session; fixed the harness to isolate sessions, then repeated successfully. Local frozen install/typecheck/lint/1,510 tests/build and eighteen Chromium workflows (22.4s) pass; SymPy 2,000 cases/6,000 comparisons, zero disagreements. Cloudflare and Neon browser authorizations succeeded; the existing Neon organization is Free and Object Storage is already enabled. Database password rotated and the local ignored secret updated; post-rotation verification follows. Files: hosted smoke CLI, sanitized evidence, checkpoint/deployment notes and local baseline reports. No deployed Worker or object-storage integration is claimed. Commit/push/checks pending.

TASK-0024A post-rotation result: the same real Neon smoke passed using the replacement password; typecheck/lint and formatting pass. No secret values were emitted or committed.

TASK-0024A remote result: 2f0c057 passed verify/oracle/ocr-metrics in run 38112668069. PR #23 merged after checks; remote main synchronized. The original archive hash remains unchanged.

## TASK-0024B — Private Neon Object Storage

Date: 2026-10-10. Branch: feat/neon-private-storage. Objective: extend the existing private S3 adapter for the already-enabled Neon storage service without changing local/R2 contracts. Acceptance: explicit complete configuration; TLS Neon endpoint validation; no ambiguous provider selection; scoped credential and private tracelab-submissions bucket on the existing Free project; real upload/read/list/delete and anonymous denial; API ownership remains enforced; preserve database images and migration tooling; no public URLs or secrets in evidence. Retention scheduling and broader deletion policy remain separate work.

TASK-0024B local result: shared private S3 implementation with distinct Neon/R2 kinds, strict endpoint/region/bucket configuration, mixed-provider rejection, explicit smoke commands and environment documentation. Actual signed upload, byte-identical retrieval, listing and deletion pass; anonymous GET returns 403. Actual Neon submission/review workflow also passes through the private object store after a connection restart. 1,532 tests (22 new transport/configuration cases), typecheck/lint pass; build/format checks follow. No existing uploads bucket or local database data was changed. The controlled standalone object was deleted; isolated workflow fixtures are retained. Credential response was captured directly into the ignored mode-0600 file, never printed. Previous task merge: 78d1ee9ba2f8d285f430da7ab209009546f13364; remote smoke source blob a1fe7c20b2ca522f7f30d14384175a8d7cbda1ab matches local main.

TASK-0024B preservation result: dry-run found three earlier fictional cloud images in PostgreSQL; explicit transactional migration moved all three, leaving zero database image rows. All four resulting object references were retrieved and matched stored lengths/SHA-256. Reconciliation scanned four and deleted zero. Local SQLite is untouched. Production build and final formatting pass. Commit/push/checks follow.

TASK-0024B remote result: d321f38 passed verify/oracle/ocr-metrics in run 38113053701. PR #24 merged after checks; main synchronized.

## TASK-0024C — Free cloud runtime and deployment

Date: 2026-10-10. Branch: feat/cloudflare-neon-deployment. Objective: deploy the existing Next/Hono workflow without weakening image/authentication checks. Acceptance: reproducible Next/OpenNext build; private bridge to Node.js backend; secrets withheld; real cloud database/storage; free plans only; complete browser workflow and unauthorized backend/image rejection; deployment evidence, rollback and limitations documented. Runtime experiment: Wrangler 4.149.0 dry-run bundles the unchanged API, but local workerd startup fails in Sharp's createRequire initialization. Next 16 is supported by OpenNext; vinext is current but would not resolve native server dependencies. Select OpenNext frontend/bridge on Workers Free and existing Hono API on Neon Node.js 24 Functions, available in the existing region/Free project. Preserve local mode and scrypt/Sharp behavior. Neon Functions Free documentation lists 10 active/400 waiting Capacity-Hours and 1M invocations monthly; no paid service activation is authorized. Public deployment is not yet verified.

TASK-0024C deployment result (2026-10-11): OpenNext frontend uploaded after high-severity dependency audit correction, Worker version 176f1aaa-1bd9-4198-b57d-de0055514d12. Existing API deployed to Neon function tracelabapi version 2; version 1 was an authenticated architecture probe after the dual-architecture package exceeded the provider's 10 MiB archive cap. Measured runtime Linux arm64/Node 24.16.0; single-architecture package succeeds. Public health confirms Neon/private-neon/OCR unavailable; direct backend anonymous access 401. Five public Chromium workflows pass (28.9s), including authentication/classrooms/upload/grading/review/reload/accessibility; 18 local workflows pass (21.8s). 1,553 tests pass. Twenty sequential public health samples: p50 123.33ms/p95 361.41ms, zero failures. An explicit public anonymous-image regression and final checks follow. No hosted OCR accuracy or load capacity claim. Added [[ADR-0006-Free-Cloud-Runtime]] and preserved native licenses. Strict channel binding remains a documented follow-up: current serverless driver encrypts with WSS and does not prove SCRAM-PLUS negotiation.

TASK-0024C final browser/security update: all five public workflows pass again (26.5s), now explicitly verifying decoded teacher image pixels and anonymous application image HTTP 401. The four introduced low/moderate CLI advisories were also patched; pnpm audit now reports no known vulnerabilities. 1,553 tests/typecheck/lint pass. Local Playwright clears the new Neon storage variables to prevent test fixtures touching cloud storage when callers have cloud variables set. Final formatting/local browser checks and checked GitHub merge follow.

## TASK-0025 — Require PostgreSQL TLS and channel binding

Date: 2026-10-11. Branch: security/neon-channel-binding, based on verified remote main 2a01f74fb72f775fa7b05e2f0764d487757b0224 (PR #25). Deployment feature 533c1cf passed verify/oracle/ocr-metrics in CI run 38130998156 before ordinary merge.
Objective: replace the Node backend's encrypted WebSocket database transport with certificate-verified PostgreSQL TLS and required SCRAM channel binding, preserving transactions and local SQLite.
Acceptance criteria: reject authentication downgrade and unsafe URL settings; test pool rollback/release; verify an actual channel-bound Neon connection and existing workflow; build deployable API; no credential output; checked PR before production update.
Status: active; no new test/deployment result claimed yet.

TASK-0025 verification: 35 new protocol/configuration/pool tests pass, using an independent TLS wire peer with an ephemeral certificate, not mocked SCRAM. Valid certificate-bound exchange succeeds; untrusted certificate, cleartext, MD5, unbound SCRAM, trust/early-ready, forged proof, repeated authentication/continuation and premature final messages fail. Pool transaction tests cover parameter binding, write locks, read-only snapshots, commit, rollback and release even after rollback failure. The real Neon read-only probe measured TLS 1.3 with a verified PLUS server proof; the full existing private-storage workflow passes with five matching migrations. New pg 8.23.1 dependency is pinned; removed the unused WebSocket driver. API/OpenNext production builds pass and dependency audit reports no known vulnerabilities. Strict TypeScript required re-reading the protocol session after pg's async mutation; fixed without weakening types. Pending: PR CI, checked merge, exact-commit production rollout and public browser verification.

TASK-0025 local release gate: all 1,588 tests pass (including 9,500 seeded property cases); typecheck, ESLint, formatting and rebuilt API pass. The 35 focused cases pass. A failed rollback now discards the pooled connection rather than returning an uncertain transaction to later requests; regression tests preserve the original error and verify discard. Current public deployment remains version 2 until checked rollout. Cloudflare durable token was validated active and read access to the existing Worker returned 200; GitHub encrypted secret is saved, with no token printed.

## TASK-0026 — Verify and automate production deployment

Date: 2026-10-11. Branch: ci/verified-production-deployment, based on synchronized main eb816f07c3f7be5445bd176f0954c9c9ae91a398. Security feature 4d71413 merged via PR #26 after all checks passed in run 38155631467 (verify 2m16s, oracle 57s, OCR metrics 10s).
Objective: exercise provider credentials from GitHub, verify the exact deployed commit in a real browser, then deploy future main commits only after successful engineering checks.
Acceptance: first authenticated workflow deploys both services and passes public browser tests; automatic trigger only accepts successful main checks from the official repository; exact SHA checkout and stale-run protection; secrets restricted to publishing steps; evidence and rollback versions recorded.
Status: first manual run 38155822011 is active, no result claimed. No SQL migration or paid service is needed.

TASK-0026 first deployment result: run 38155822011 deployed both providers, but the public suite passed only four of five tests. The classroom test reached its 90-second deadline; context cleanup obscured the blocked action. Health still returns 200. Automatic deployment is not activated; source-selection/release verification implementation is preserved on this branch while the browser failure is diagnosed separately. Fourteen release-guard/health cases, typecheck/lint/format and API/OpenNext builds pass locally. No browser timeout has been weakened and no deployment success is claimed for this failed acceptance run.

## TASK-0027 — Diagnose cloud browser deadline

Date: 2026-10-11. Branch: test/cloud-browser-diagnostics, based on synchronized main eb816f0. The first authenticated deployment run 38155822011 published both services but failed one classroom browser test at the 90-second deadline; four other cloud tests passed. Health remained 200. Its cleanup error hid the waiting operation, and only the safe JSON report was uploaded, so the triggering action is not established. A focused local Chromium reproduction against the same public deployment passes in 13.7s (14.7s suite), preserved in artifacts/cloud-classroom-reproduction.json. This does not erase the CI failure.
Acceptance: record safe named phase checkpoints; bound individual actions/navigation/image requests to 15 seconds without increasing the overall timeout; preserve original failure when context cleanup also fails; rerun the complete public suite and CI before claiming recovery. Automatic deployment work is committed/pushed separately at 7250406, not merged or activated.

TASK-0027 local result: all five public Chromium tests pass in 32.5 seconds, classroom path 17.2 seconds, including private decoded image/anonymous denial and teacher/student refresh/login. Original failed CI report is preserved as artifacts/cloud-ci-deadline.json, focused reproduction as artifacts/cloud-classroom-reproduction.json, full rerun as artifacts/cloud-browser-results.json. Typecheck/lint/format, actionlint 1.7.12 (verified release checksum), vault links and diff checks pass. New manual Public browser verification workflow carries no provider secrets and reruns browser acceptance without redeployment. Original CI deadline root cause remains unknown pending phase-instrumented Linux execution.

TASK-0026 resumed: main 4b9cacf (PR #27) merged into the automation branch as aff008a; the ledger conflict was resolved by retaining both complete task records. All 1,602 tests pass, including 14 release-guard/health cases, and typecheck/lint/format pass. Linux public browser rerun 38156595138 is active. Automatic rollout remains gated pending its result and PR checks. The release helper explicitly allows only generated browser evidence; application-input benchmark JSON remains protected from uncommitted deployment.

TASK-0027 Linux acceptance: public-only run 38156595138 passes all five Chromium workflows in 31.775 seconds, zero failed/skipped/flaky results and no retries. Every classroom phase completes. Report preserved in artifacts/cloud-linux-browser-results.json. The first run's deadline remains an unexplained intermittent incident, not a proven fixed application defect.

TASK-0026 readiness: live public workflow now passes on both local Chromium and GitHub Linux against API version 3/Worker d52154f5-74fc-41ec-91fd-1da99ba85932. New Worker dry-run passes at 1,404.98 KiB gzip with backend/origin/release bindings present. Checked automatic release activation and exact provider-SHA smoke are next.

## TASK-0028 — Bounded hosted handwriting OCR comparison

Date: 2026-10-11. Branch: research/hosted-ocr-benchmark, based on verified main 49c10be393b3377e3d3f795b1094a89a77427e78 (PR #28). Automation PR passed all checks in run 38156891087; post-merge run 38176615632 will trigger the first automatic release. Do not merge this task before that rollout finishes.
Objective: measure hosted vision transcription using existing non-sensitive, attributed MathWriting research samples before selecting a public OCR adapter.
Acceptance: reproducible fixed sample IDs and image hashes; limited calls/output tokens with no billing/plan change; preserve every failure and raw prediction; validate provider output; publish measured fidelity/latency and explicit unmeasured camera/correction/grading limits. No production OCR activation or model grading.
Research: authorized Cloudflare model catalog read returns 200. Workers Free has a hard daily inference allowance; candidate availability must be verified by actual requests, not catalog descriptions. Existing public manual workflow remains functional.

TASK-0026 completed: automatic run 38176846122 passed on main 49c10be, publishing API version 4 and Worker 945329de-a2a5-4baf-a220-d0ccdb967c0a. Both SHA checks and all five public browser workflows pass (34.3s); eighteen local workflows pass (35.4s). Reports preserved. No secrets, schema change or plan upgrade.

TASK-0028 measured result: all 16 reserved calls returned HTTP 200. Moondream returned eight empty objects. Mistral returned seven structured objects and one invalid JSON string; the initial client rejected objects. Preserved original evidence, corrected the parser with a captured-response regression, and rescored offline without additional calls: 0/8 exact each; Mistral edit rate 0.4878, one invalid output, 57.5496 reported neurons. Thirty-seven Python benchmark tests pass; ruff checks pass. Initial test assumption that every Mistral output would parse failed; raw inspection identified invalid LaTeX escapes in the eighth response and the regression preserves rejection. Production selection and camera validation remain open. Files: cloud_benchmark.py, test_cloud_benchmark.py, both JSON reports, research README/license and related vault evidence. GitHub push/check/merge pending.

## TASK-0030 — Verify release propagation within a bounded deadline

Date: 2026-10-11. Branch: fix/release-propagation-check, from synchronized main b42e065. Quota work is safely committed/pushed at 2304080a7b869cea006be245199ccf60b88cfd72 on security/durable-demo-budgets; no production migration has run.
Reproduction: automatic run 38177734175 published API version 5 / Worker f6d45cad-76fa-4509-8497-de334b2943d2. Immediate smoke saw API b42e065 but Worker 49c10be and correctly failed the exact-SHA assertion; public browser step was skipped. A later public health probe saw both b42e065. Root cause in the gate: it samples only once immediately after publication and treats transitional version skew as terminal. Actual global propagation time was not measured.
Acceptance: bounded read-only polling with per-request/overall deadlines, exact commit/storage/health checks unchanged, failure evidence retained, safe allowlisted diagnostics, deterministic regressions for stale/wrong/invalid/unavailable responses, then checked rollout and all public browser workflows. No blind redeploy or relaxation of the acceptance predicate.

TASK-0030 verification: 15 new cases and all 1,617 branch tests pass; typecheck/lint pass. Live fixed-origin probe confirms API/Worker b42e065, one request in 2.206s at 2026-10-12T03:32:05Z. The failed-run artifact was inspected and proved inherited from the earlier successful release; workflows now clear old reports and failure polling writes fresh safe observations. No deployments or database changes were made during this fix. Original mismatched probe and subsequent DFW observation preserved; CI/checked merge/automatic browser gate pending.
