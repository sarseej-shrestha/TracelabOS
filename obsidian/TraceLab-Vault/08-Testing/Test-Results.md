# Test Results

Final local checkpoint: 2026-10-08 (America/Chicago).

| Verification                   | Actual result                                             |
| ------------------------------ | --------------------------------------------------------- |
| Vitest                         | 358 passed; 0 failed; 5 test files                        |
| Seeded properties              | 5,000 cases inside 3 Vitest tests                         |
| Strict TypeScript              | Passed                                                    |
| ESLint                         | Passed                                                    |
| Prettier                       | Passed                                                    |
| Next.js production build       | Passed                                                    |
| SymPy oracle                   | 2,000 generated cases; 6,000 comparisons; 0 disagreements |
| Vault checker                  | 84 substantive notes; all wiki links resolve              |
| Playwright / axe / mobile      | Blocked before assertions: listen EPERM 127.0.0.1:3000    |
| GitHub Actions                 | Configured, not run; no push exists                       |
| Live OCR / deployment          | Not run; no provider/resources configured                 |
| Dependency vulnerability audit | Not executed; network unavailable                         |

Executed final command: `npm run verify`, exit 0. Full log: artifacts/final-verification.log. JSON suite results: artifacts/unit-integration-results.json. Oracle result: artifacts/sympy-results.json. Browser initialization failure: artifacts/browser-results.json.

The Python oracle used Python 3.13.9 and SymPy 1.14.0 from an existing read-only environment; recreate from the pinned requirements for portability. Node was 23.10.0, outside some dependencies' supported even-LTS engine ranges; use Node 22.13+ or 24+ for continued checks.

An earlier run contained 344 tests; two classifier regressions and twelve persistence/session/security tests brought the final suite to 358. These counts do not establish broad-domain precision or real handwriting accuracy.

Related: [[Test-Matrix]] · [[Math-Engine-Results]] · [[Current-State]]

## Recovery rerun

After verified extraction to a fresh directory and clean npm ci using the existing lockfile, npm run verify exited 0 again: all 358 tests/5,000 seeded cases, typecheck, lint, and production build passed. Formatting and all 84 notes/links passed. SymPy repeated 2,000 cases/6,000 comparisons with zero disagreements (Python 3.13.9/SymPy 1.14.0). Original artifacts are unchanged; new evidence is under recovery/verification/. Node 23.10.0 engine warnings remain disclosed. A fresh socket probe confirmed EPERM; no repeat browser attempt or browser pass is claimed. This validates restoration on the same restricted host, not a completed move to a new authorized runtime.

## Full-access browser checkpoint — 2026-10-08

361 Vitest tests passed, zero failed; typecheck, lint, production build passed. Five Playwright Chromium tests passed in 7.5s. Artifacts/browser-results.json and three screenshots record local results. GitHub baseline CI failed installation (npm Invalid Version), so remote verification remains pending tooling repair.

## PostgreSQL checkpoint — 2026-10-08

398 tests passed, zero failed on Node 22.23.3. The 24 API tests now run on both SQLite and PostgreSQL/PGlite. Added concurrent create/edit/confirmation, rollback-on-event-failure, transaction recovery, migration checksum/atomicity, parameter binding and full local-to-PostgreSQL import preservation tests. Typecheck/lint/build passed. Five browser tests passed in 5.5s against the local production server. pnpm audit: no known vulnerabilities. Evidence: artifacts/postgresql-verification.log. This does not verify Neon connectivity or R2 storage.

## Private R2 checkpoint — 2026-10-08

416 tests passed, zero failed; typecheck/lint/build passed; five Chromium tests passed in 5.8s; pnpm audit found no known vulnerabilities. Added signed local S3 protocol requests, private-object API authorization, source-preserving migration, storage failure, integrity mismatch and orphan reconciliation tests on SQLite/PostgreSQL. Evidence: artifacts/r2-verification.log. No live R2 call or deployment is claimed.

## Experimental OCR adapter checkpoint

444 TypeScript tests, 24 Python tests, TypeScript/lint/Ruff and production build passed locally. Real HTTP smoke against the running Pix2Text service rejected missing authentication and returned schema-valid extraction with pixel-derived coordinates. See artifacts/ocr-service-smoke.json. This is provider verification, not photographed classroom workflow acceptance.

## 2026-10-09 — Durable OCR backend

470 TypeScript tests pass; strict typecheck, ESLint and production build pass. The 26 added dual-database tests exercise authorization, idempotency, persisted quotas, lease recovery/exhaustion, retry backoff, cancellation during inference, stale-result rejection, output validation, changed-image rejection and preservation of original OCR beside corrected work. Import regression covers both image references and OCR provenance. Initial failures exposed cross-test queue contamination (fixtures now isolated), the new third migration count, and the genuine importer identifier defect tracked in [[Regression-History]]. No test expectation was relaxed to hide an application defect.

Real-model workflow smoke used the licensed MathWriting rendered human-stroke sample 002ae6d5dd4173e4-clean.png, not a photograph. The API uploaded/normalized it, enqueued a durable job and called the running authenticated model. One line was extracted; evaluation remained null. A deliberate replacement with known distribution-demo steps was explicitly confirmed, graded and teacher-reviewed. artifacts/ocr-workflow-smoke.json records the measured 100.57ms worker duration. This does not measure recognition accuracy or demonstrate image/question agreement.

## 2026-10-09 — OCR browser workspace

Eight Playwright tests pass (12.7s). New cases verify persisted HTTP-provider/worker processing, original-versus-corrected transcription, reset confirmation, teacher inspection, invalid-output fallback, saved-draft cancellation and stale-output rejection. Axe passes the expanded transcription view. The deterministic provider is explicitly test-only; browser databases are isolated from local records/cloud credentials. Screenshot: artifacts/ocr-confirmation-workspace.png.

Separately, actual Python/ONNX inference through the running Next UI and durable worker passed a Chromium smoke in 1465.52ms. Input was the same licensed MathWriting rendered human-stroke sample 002ae6d5dd4173e4-clean.png. One original line was retained; evaluation stayed null until deliberate replacement with a known distribution fixture and explicit confirmation. Teacher review finalized the result. Report: artifacts/ocr-browser-smoke.json. This does not establish accuracy or image/question agreement.

## 2026-10-09 fraction curriculum

655 TypeScript tests pass; typecheck, ESLint and production build pass. Nine browser tests pass (14.4s), including teacher fraction preview, generated division assignment, student diagram/confirmation and mobile axe checks. Both SymPy suites pass: 11,700 new curriculum comparisons plus 6,000 existing comparisons, zero disagreements. The new Python script initially shadowed the standard-library fractions module; renaming it to curriculum_oracle.py corrected import resolution before either result was accepted. New API tests initially reused a revoked demo-role cookie; they now perform the actual role switch, retaining the application's session invalidation behavior.

## 2026-10-09 algebra curriculum

827 TypeScript tests pass; strict typecheck, ESLint and production build pass. Ten Chromium workflows pass (15.0s), including collected-expression completion and axe checks. Algebra oracle: 1,800 cases/11,400 comparisons, zero disagreements; fraction oracle rerun: 1,800/11,700, zero disagreements. Five Python unittest cases verify the independent oracle parser and goal semantics; the prior 24 OCR metric/region tests remain in CI. Figures/reference/alternative paths, legacy behavior, ambiguous identities/nonlinear review and incomplete affine forms have regressions. Reports: artifacts/algebra-oracle-results.json and algebra-verification.log.

## 2026-10-09 ratios checkpoint

1,083 Vitest tests pass; 7,000 seeded cases include 2,000 new proportion/perturbation cases. TypeScript, ESLint and production build pass. Eleven Chromium workflows pass (16.1s), including ratio publication, confirmation and visible domain conditions with axe checks. Independent ratio oracle: 1,800 cases / 11,850 comparisons / zero disagreements. Five Python oracle regression cases pass. Prior OCR and earlier-domain checks remain in CI. Evidence: artifacts/ratio-verification.log, ratio-oracle-results.json and browser-results.json.

## 2026-10-09 quantity verifier

1,141 Vitest tests, strict TypeScript and ESLint pass. Added 58 quantity tests including 1,000 seeded conversion cases. Independent SymPy quantity checks: 2,000 cases, zero disagreements. Last browser/build checkpoint remains the ratio integration: eleven workflows and production build passed; the standalone verifier does not change exposed application paths. CI will repeat all gates before merge.

PR #12 CI run 37992150994 passed verify, oracle and ocr-metrics, including production build and all eleven browser workflows. Feature 434ebb9 is merged as 0113e1ca334621d8db131fc7a61ef7412ea2d3b2. A separate current-preview smoke returned HTTP 200 and confirmed the guided-demo control was visible; it is not counted as an additional end-to-end test.
