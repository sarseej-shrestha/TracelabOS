# TraceLab OS — Current State

Checkpoint date: 2026-10-08. This is a verified local foundation, not the complete requested product.

## Full-access recovery update

2026-10-08: permissions have been restored. Git metadata creation succeeds, localhost binding succeeds, GitHub authenticates as sarseej-shrestha with push/admin permission, and the official remote has no refs. GitHub confirms sarseej.shrestha@selu.edu is verified and primary. Repository-local identity is Sarseej Shrestha with that address. The original archive checksum remains valid. A single honest baseline import is being prepared on main; no hash or push is claimed before completion. Browser verification is now pending execution rather than permission-blocked. Earlier restriction reports below are historical.

Online npm ci exposed an npm 11.4.2 optional-dependency deduplication error (Invalid Version, nested sharp). The unchanged lockfile installs using the previously verified offline cache. A dedicated post-baseline tooling task will repair online reproducibility and verify CI.

## Current Development Phase

Phase 0/1 foundation with a bounded Phase 2 math engine and partial upload/teacher-review features. No full phase exit is claimed while mandatory Git, OCR, browser, and hosting work remains incomplete.

## Active Task

Recovery checkpoint: verified backup and clean restored-tree verification complete. Await an authorized Git/network/preview environment; no feature work started.

## Current Git Branch

None. The workspace began empty and `.git` creation was denied by the environment's read-only protection. Planned branches are recorded in [[Change-Ledger]]; none actually exists.

## Latest Commit Hash

None. No commit could be created. Do not invent a hash or recover nonexistent history.

## Latest Successful Push

None. Shell DNS could not resolve github.com; gh could not validate the stored credential. The public official repository was observed empty using the web tool. Push authorization has not been verified.

## Latest Verified Test Results

Recovery rerun (2026-10-08 America/Chicago): archive extracted to a fresh temporary directory; npm ci from the unchanged lockfile installed 294 packages. All checks below were repeated successfully in that restored tree. Evidence: recovery/verification/summary.json and verify.log. This is a restore rehearsal within the same restricted host, not a migration to an authorized Git-enabled environment.

- 358 Vitest tests passed; 0 failed. Machine-readable report: artifacts/unit-integration-results.json.
- The suite includes 5,000 fixed-seed property cases inside three tests.
- SymPy independent oracle: 2,000 generated cases, 6,000 comparisons, 0 disagreements. Python Fraction also cross-checks rational sums. See artifacts/sympy-results.json.
- Final npm run verify exited 0: strict TypeScript, ESLint, all 358 tests, and Next production build passed. Prettier and the 84-note vault-link check also passed. See [[Test-Results]].
- Playwright was attempted but could not start its server: listen EPERM on 127.0.0.1:3000. No browser, mobile, or axe assertion ran.
- Math-only benchmark: 10,000 four-step evaluations after 500 warmups; see artifacts/math-benchmark.json for exact latest timings and machine. No cloud/API latency is claimed.

## Completed Features

- Real local Next.js/Hono application build, strict TypeScript, workspace manifests, format/lint/test tooling, and CI configuration (CI not run remotely).
- Local session/password authentication and isolated fictional demo roles.
- Classroom creation/enrollment, seeded assignment preview/publishing, feedback policy, due-date storage.
- Local private JPEG/PNG upload, signature/decode/pixel limits, EXIF normalization, authenticated retrieval; client crop/rotation controls are implemented but browser verification is blocked.
- Versioned manual transcription, explicit student confirmation, stale-write protection, idempotent confirmation/grading.
- Exact rational/affine parsing and verification, distribution/fraction error classification, first-error and propagation outcomes, uncertainty barriers.
- Teacher inspection, append-only override/release, actual submission/finalized-decision counts, persisted event history.
- Complete requested Obsidian note structure with substantive architecture, research, design, operations, and recovery content.

## Partially Completed Features

Four skills/four templates with two examples and three difficulty ranges; requested broader coverage is incomplete. Rule-based prerequisite explanation exists without persisted mastery or practice delivery. OCR provider contract exists without a live provider. Event history slider exists without a state replay reducer or WebSockets. API and build verified; UI interactions remain unverified in a browser.

## Pending Features

Neon/PostgreSQL adapter and full normalized schema/migrations; R2/Queues/Durable Objects; real OCR benchmark and selected model; asynchronous job lifecycle; larger curriculum and figures; mathematical domain/rule expansion and labeled precision benchmark; targeted remediation and mastery; deletion/retention; distributed quotas; production browser/accessibility/load/security validation; deployment and live acceptance.

## Known Bugs

No failing executed test at checkpoint. Two math-classifier defects found during review were fixed with regressions: variable-bearing answers incorrectly matched denominator addition, and a zero diagnostic denominator concealed a provable error. Known design limitations are in [[Known-Issues]]; unexecuted browser tests may reveal further bugs.

## Current Blockers

Fresh recovery probes confirm the same restrictions. Workspace owner uid 501/mode 0755 and installed Git are ordinary; the active sandbox specifically marks .git read-only and disables sandbox_approval. No permission-change tool or preexisting managed worktree is available. A permission-profile change was requested from the user; no approval/environment change has arrived. The source backup is verified (150 files, 84 notes; SHA-256 acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc).

1. `.git` writes are denied by the session permissions; no branch/commit/push workflow can execute.
2. Shell network DNS fails for GitHub and npm; credentials cannot be validated and pnpm cannot download.
3. localhost listen is denied, preventing production browser validation.
4. Cloud resources/provider credentials are not configured; no live OCR or deployment was attempted.

## Important Architecture Decisions

[[ADR-0001-System-Architecture]] modular monolith; [[ADR-0002-Database-Selection]] honest local SQLite adapter pending PostgreSQL; [[ADR-0003-OCR-Strategy]] mandatory confirmation and model selection by benchmark; [[ADR-0004-Mathematical-Verification]] exact bounded rational affine domain.

## Required Environment Variables

Local defaults need no secrets. Optional TRACELAB_DB_PATH selects persistent SQLite, CHROMIUM_PATH selects browser, NEXT_TELEMETRY_DISABLED disables telemetry. Cloud DATABASE_URL/account credentials are future configuration, not connected features. Never commit `.env`, photos, or database files.

## Exact Next Steps

1. Preserve recovery/tracelab-baseline-20261009T000129Z.tar.gz and its manifest, then restore an execution profile allowing approved Git metadata writes, GitHub/npm network, and localhost preview. Re-check remote state and gh authentication; do not overwrite newly created history.
2. Configure repository-local identity Sarseej Shrestha using the existing verified/configured email sarseej.shrestha@selu.edu after rechecking credentials.
3. If the authenticated remote is still empty, create ONE honest baseline import commit for the existing foundation (no fabricated historical task commits). Push to the exact official repository and verify hashes/files. Use task branches only after this baseline. See recovery/BASELINE-IMPORT.md.
4. Run npm ci, npm run verify, and npm run test:e2e. Fix browser/accessibility failures before claiming a usable verified UI.
5. Install pnpm, generate/test its frozen lock, run dependency audit, then implement PostgreSQL repository/migration contracts.
6. Follow [[Task-Backlog]] through genuine OCR and full acceptance. Do not restart completed math/API work without checking evidence.

## Recovery Procedure

Read [[00-START-HERE]], this note, [[Master-Roadmap]], [[Change-Ledger]], and [[Known-Issues]]. Inspect current files, Git availability, remote, and artifacts. Re-run relevant checks. Node 23.10.0 ran this checkpoint but some dependencies support only even LTS versions; use Node 22.13+ or 24+ for continued validation. The oracle ran using a read-only existing Python environment with SymPy; recreate it from research/symbolic-oracle/requirements.txt rather than depending on another project. See [[Recovery-Instructions]].
