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
