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
