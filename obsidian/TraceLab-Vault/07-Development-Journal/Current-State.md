# TraceLab OS — Current State

Checkpoint: 2026-10-08 America/Chicago. This is a verified local application, not the complete requested product.

## Current Development Phase

Recovery and Phase 1/2 foundation; cloud persistence is next after CI repair.

## Active Task

TASK-0008 browser verification passed locally. Repair online dependency installation before merge.

## Current Git Branch

test/recovery-browser-verification

## Latest Commit Hash

Baseline: 839d63439e9c2d5e3f800592cb68003bf1cec3c9. A checkpoint records the preceding verified commit, avoiding a self-referential hash.

## Latest Successful Push

Baseline pushed to official main; GitHub contents API and matching remote hash verified. Browser task push pending.

## Latest Verified Test Results

361 Vitest tests pass, including 5,000 seeded property cases and three new origin regressions. Strict typecheck, ESLint and production build pass. Five Chromium E2E tests pass (7.5 seconds): authenticated classroom publication/enrollment, controlled image upload/rotation, confirmed transcription, withheld/released feedback, teacher review, login, demo reasoning, mobile overflow, keyboard navigation, 200% text zoom and automated axe checks. The image fixture is typeset, not evidence of handwriting OCR. Recovery oracle: 2,000 cases, 6,000 comparisons, zero disagreements. GitHub CI run 37863511190 failed during npm ci; no remote check pass claimed.

## Completed Features

Local persistent authentication, classrooms/enrollment, generated assignments, private validated images, versioned confirmed transcription, deterministic rational/affine reasoning, first-error propagation, teacher override/release, event history, responsive student/teacher UI, and 84 substantive vault notes. Backup extraction and hashes verified. Git/network/localhost/Chromium permissions restored.

## Partially Completed Features

Four skills/templates; rule recommendations without persisted mastery; OCR contract without a provider; history slider without deterministic state replay/WebSockets. Browser verification covers the current local workflows, not missing cloud features.

## Pending Features

PostgreSQL and R2; actual OCR and benchmark; expanded curriculum; mastery/remediation; real-time/replay; retention/deletion; deployment, load tests and live acceptance.

## Known Bugs

Fixed: Next's internal URL hostname differed from browser Origin, rejecting valid mutations. Explicit public-origin allowlist now tested; forwarded-host values cannot grant trust. Open: npm online install crashes in nested sharp optional-dependency deduplication. See [[Regression-History]].

## Current Blockers

No remaining filesystem, Git, network or browser restriction observed. Cloud credentials/resources are absent. GitHub CI dependency install must be repaired before merging browser work.

## Important Architecture Decisions

Modular monolith, exact bounded math domain, mandatory transcription confirmation, append-only review history. Local SQLite remains active; cloud persistence is not yet implemented.

## Required Environment Variables

TRACELAB_DB_PATH optionally selects SQLite. TRACELAB_PUBLIC_ORIGIN sets the explicit trusted browser origin; localhost defaults support development only. CHROMIUM_PATH optionally selects installed browser. Never commit private databases, photos, credentials or environment files.

## Exact Next Steps

1. Commit/push browser fix and evidence on its task branch.
2. Establish reproducible pnpm frozen installs on supported Node LTS, fix CI and audit dependencies; merge only after checks pass.
3. Implement PostgreSQL/private object storage while preserving local mode.
4. Continue [[Master-Roadmap]] through real OCR and deployment; record external credential blockers accurately.

## Recovery Procedure

Read [[00-START-HERE]], this note, [[Recovery-Instructions]] and ledger; inspect Git status/log/remote before changing files. Original backup recovery/tracelab-baseline-20261009T000129Z.tar.gz has SHA-256 acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc; 150 files/84 notes were extracted and hash-checked. This archive predates subsequent recovery fixes: use Git for newer work. Use Node 22 LTS and the pinned package manager. Earlier blocked-environment reports are historical.
