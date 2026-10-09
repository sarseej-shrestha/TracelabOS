# TraceLab OS — Current State

Checkpoint: 2026-10-08 America/Chicago. This is a verified local application, not the complete requested product.

## Current Development Phase

Recovery and Phase 1/2 foundation; cloud persistence is next after CI repair.

## Active Task

TASK-0016 fixes a recovery importer identifier regression discovered during TASK-0015 OCR jobs; queue changes are preserved in a named Git stash.

## Current Git Branch

fix/import-column-identifiers

## Latest Commit Hash

Latest verified remote main: c6bf708fa08e3a439cf2769dee81d409bf51a39a (benchmark PR #4 merge). Original baseline: 839d63439e9c2d5e3f800592cb68003bf1cec3c9. This note records the preceding verified commit rather than its own hash.

## Latest Successful Push

Recovery, PostgreSQL, R2 and OCR research PRs #1–#4 merged after checks passed. Remote main c6bf708fa08e3a439cf2769dee81d409bf51a39a was verified. Adapter task push/checks pending.

## Latest Verified Test Results

444 Vitest tests pass, including 5,000 seeded property cases and three new origin regressions. Strict typecheck, ESLint and production build pass. Five Chromium E2E tests pass (5.8 seconds): authenticated classroom publication/enrollment, controlled image upload/rotation, confirmed transcription, withheld/released feedback, teacher review, login, demo reasoning, mobile overflow, keyboard navigation, 200% text zoom and automated axe checks. The image fixture is typeset, not evidence of handwriting OCR. Recovery oracle: 2,000 cases, 6,000 comparisons, zero disagreements. Baseline CI failed npm install; repaired pnpm frozen install and patched dependencies passed GitHub run 37864780014. PostgreSQL PR #2 passed GitHub run 37865456695 and merged. R2 PR #3 passed GitHub run 37868611108 and merged. OCR research adds 18 passing Python tests and two measured 72-image pilot runs.

## Completed Features

Local persistent authentication, classrooms/enrollment, generated assignments, private validated images, versioned confirmed transcription, deterministic rational/affine reasoning, first-error propagation, teacher override/release, event history, responsive student/teacher UI, and 86 substantive vault notes. Backup extraction and hashes verified. Git/network/localhost/Chromium permissions restored.

## Partially Completed Features

Four skills/templates; rule recommendations without persisted mastery; Experimental authenticated local OCR provider and offline model experiments; application jobs/UI are not connected; history slider without deterministic state replay/WebSockets. Browser verification covers the current local workflows, not missing cloud features.

## Pending Features

Hosted Neon/R2 verification; actual OCR and benchmark; expanded curriculum; mastery/remediation; real-time/replay; retention/deletion; deployment, load tests and live acceptance.

## Known Bugs

Fixed: Next's internal URL hostname differed from browser Origin, rejecting valid mutations. Explicit public-origin allowlist now tested; forwarded-host values cannot grant trust. Resolved: npm optional-dependency install crash through frozen pnpm and patched dependencies. Corrected workspace contrast and premature axe scan. See [[Regression-History]].

## Current Blockers

No remaining filesystem, Git, network or browser restriction observed. Cloud credentials/resources are absent. Neon network/pool behavior and cloud latency remain unverified; PGlite validates PostgreSQL SQL locally.

## Important Architecture Decisions

Modular monolith, exact bounded math domain, mandatory transcription confirmation, append-only review history. SQLite remains the default; DATABASE_URL selects the new Neon adapter. See [[ADR-0005-Async-Persistence]].

## Required Environment Variables

TRACELAB_DB_PATH optionally selects SQLite. TRACELAB_PUBLIC_ORIGIN sets the explicit trusted browser origin; localhost defaults support development only. CHROMIUM_PATH optionally selects installed browser. Never commit private databases, photos, credentials or environment files.

## Exact Next Steps

1. Commit/push the local OCR adapter and merge after checks.
2. Integrate durable processing jobs, retries/cancellation, preserved raw output and student correction into the real UI. Keep targeted photograph acceptance open.
3. Verify hosted adapters when cloud credentials are configured.
4. Continue [[Master-Roadmap]] through real OCR and deployment; record external credential blockers accurately.

## Recovery Procedure

Read [[00-START-HERE]], this note, [[Recovery-Instructions]] and ledger; inspect Git status/log/remote before changing files. Original backup recovery/tracelab-baseline-20261009T000129Z.tar.gz has SHA-256 acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc; 150 files/84 notes were extracted and hash-checked. This archive predates subsequent recovery fixes: use Git for newer work. Use Node 22 LTS and the pinned package manager. Earlier blocked-environment reports are historical.
