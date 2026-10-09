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
