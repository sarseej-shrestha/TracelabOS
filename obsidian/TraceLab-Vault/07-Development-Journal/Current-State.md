# TraceLab OS — Current State

Checkpoint: 2026-10-09 America/Chicago. The local application is functional; the full requested product is incomplete.

## Current Development Phase

Phase 3 computer vision integration, following verified recovery and local cloud-adapter implementation.

## Active Task

TASK-0018 fraction curriculum passes local mathematical, API, browser and independent-oracle verification; commit/push/CI follows.

## Current Git Branch

feat/fraction-curriculum

## Latest Commit Hash

Latest verified remote main: 77d62fad8c141af89d3663f850464c32b8e85198 (PR #8 merge). Durable jobs commit 8893999; importer fix 88487d7; adapter be25149. This note records preceding commits rather than its own hash.

## Latest Successful Push

PRs #1–#8 merged after checks; PR #8 run 37893988907 passed verify/oracle/ocr-metrics. UI commit 8742c97 is preserved. Fraction task push/checks follow local verification.

## Latest Verified Test Results

655 Vitest tests pass, including 5,000 seeded property cases and 26 new dual-database OCR job cases. Strict TypeScript, ESLint and production build pass. Nine Chromium workflows pass (14.4s), including extraction, correction, cancellation, failure fallback, teacher provenance and axe accessibility. Latest Python checkpoint: 24 tests pass; new fraction oracle reports 1,800 cases/11,700 comparisons with zero disagreements. SymPy CI repeats 2,000 cases/6,000 comparisons with zero differences. Actual model API smoke processed the research image in 100.57ms. A separate Chromium workflow through the actual local model completed in 1465.52ms, left evaluation null until explicit correction/confirmation, detected fixture first error at step 2, and recorded a teacher review. This is workflow evidence, not camera-image accuracy.

## Completed Features

Recovery backup/hash/extraction, authorized Git/GitHub and localhost/browser access. Persistent authentication, classroom enrollment/assignments, private validated photos, versioned transcription, rational/affine verification and error propagation, teacher reviews/release and event history. SQLite local mode; Neon adapter/migrations and private R2 adapter tested locally. Actual experimental OCR provider, measured 72-image pilot per model, authenticated service, durable job leases/retries/cancellation/quotas, raw-output provenance, explicit confirmation before grading. Import regression fixed without losing data.

## Partially Completed Features

Eight skills/fourteen active templates; ratios, geometry and broader algebra remain. Rule recommendations without persisted mastery. OCR API/worker and browser processing/correction/fallback controls connected. Experimental model had only 3/72 exact matches in the general handwritten-expression pilot; targeted photographed-work accuracy remains unverified. History slider lacks deterministic reducer/WebSockets.

## Pending Features

Hosted Neon/R2 verification; targeted handwritten-photo benchmark; full curriculum; mastery/remediation; real-time/replay; retention/deletion; deployment, load tests and live acceptance.

## Known Bugs

Importer rejected digit-bearing identifiers such as sha256; fixed in 88487d7 with actual PostgreSQL preservation regression. See [[Regression-History]]. Existing OCR segmentation and accuracy limitations remain documented in [[OCR-Model-Comparison]].

## Current Blockers

No remaining filesystem, Git, network or browser restriction observed. Cloud credentials/resources are absent. Hosted database/storage/inference transport, cost and deployment remain unverified.

## Important Architecture Decisions

Modular monolith, exact bounded math, explicit student confirmation, immutable evaluation/review provenance. SQLite default; DATABASE_URL selects Neon. Jobs run in a separate Node process with 90-second leases and at most three attempts. Inference runs outside database transactions. No deployed Cloudflare queue consumer is claimed. See [[OCR-Pipeline]] and [[ADR-0005-Async-Persistence]].

## Required Environment Variables

TRACELAB_DB_PATH (use the same absolute path for API and worker) or DATABASE_URL. TRACELAB_PUBLIC_ORIGIN for hosted CSRF/cookie origin. Optional CLOUDFLARE_ACCOUNT_ID/R2_BUCKET/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY as specified in .env.example. TRACELAB_OCR_URL and TRACELAB_OCR_TOKEN enable experimental extraction; run the Python service and pnpm ocr:worker separately. CHROMIUM_PATH optionally selects installed Chromium. Keep secrets/private data ignored.

## Exact Next Steps

1. Commit/push fraction work, pass checks and merge; verify remote main.
2. Expand algebra, ratios and geometry according to [[Task-Backlog]], preserving explicit domain and unit boundaries.
3. Continue mastery/realtime/deployment in [[Master-Roadmap]]. Targeted photographed-work validation and cloud credentials remain open.

## Recovery Procedure

Read [[00-START-HERE]], this note, [[Recovery-Instructions]] and ledger; inspect status/log/remote. Original verified backup recovery/tracelab-baseline-20261009T000129Z.tar.gz SHA-256 acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc contains the original 150 files/84 notes. Git preserves subsequent work. Use Node 22 LTS, frozen pnpm install and versioned SQL migrations. Do not recreate the baseline. The original queue stash remains as an extra local recovery copy; its restored work is committed and pushed in 8893999.
