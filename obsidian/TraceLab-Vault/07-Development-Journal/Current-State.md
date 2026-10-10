# TraceLab OS — Current State

Checkpoint: 2026-10-09 America/Chicago. The local application is functional; the full requested product is incomplete.

## Current Development Phase

Curriculum expansion after verified recovery, local cloud adapters and OCR integration. Hosted validation remains pending.

## Active Task

TASK-0021C student-response disclosure fix passes local database/browser verification; commit/push/CI follows. Geometry is merged. Next product work is persisted mastery and remediation.

## Current Git Branch

security/student-question-projection

## Latest Commit Hash

Latest verified remote main: e7b20a03bb195c88a276fa586a0954293ff60714 (PR #14 merge). Quantity verifier 434ebb9, ratios 3c38f88 and algebra 572ceec are preserved. This note records preceding commits rather than its own hash.

## Latest Successful Push

PRs #1–#14 merged after checks; geometry PR #14 run 38016555988 passed verify/oracle/ocr-metrics. Geometry commits daa6111 and 570fe9a are preserved. Security push/checks follow local verification.

## Latest Verified Test Results

1,385 Vitest tests pass, including 8,000 seeded property cases and 26 new dual-database OCR job cases. Strict TypeScript, ESLint and production build pass. Thirteen Chromium workflows pass (17.3s), including extraction, correction, cancellation, failure fallback, teacher provenance and axe accessibility. Latest Python checkpoint: 24 tests pass; fraction oracle reports 1,800 cases/11,700 comparisons and algebra reports 1,800/11,400, and ratios 1,800/11,850, zero disagreements; quantity oracle 2,000 cases, zero disagreements; geometry oracle 1,800 cases/10,800 comparisons, zero disagreements; ten oracle unittest cases pass. SymPy CI repeats 2,000 cases/6,000 comparisons with zero differences. Actual model API smoke processed the research image in 100.57ms. A separate Chromium workflow through the actual local model completed in 1465.52ms, left evaluation null until explicit correction/confirmation, detected fixture first error at step 2, and recorded a teacher review. This is workflow evidence, not camera-image accuracy.

## Completed Features

Recovery backup/hash/extraction, authorized Git/GitHub and localhost/browser access. Persistent authentication, classroom enrollment/assignments, private validated photos, versioned transcription, rational/affine verification and error propagation, teacher reviews/release and event history. SQLite local mode; Neon adapter/migrations and private R2 adapter tested locally. Actual experimental OCR provider, measured 72-image pilot per model, authenticated service, durable job leases/retries/cancellation/quotas, raw-output provenance, explicit confirmation before grading. Import regression fixed without losing data.

## Partially Completed Features

Twenty-four skills/forty-eight active templates cover four scoped units. Geometry is connected to unit-aware API/browser grading and known SVG figures; broader symbolic formulas remain unsupported. Rule recommendations without persisted mastery. OCR API/worker and browser processing/correction/fallback controls connected. Experimental model had only 3/72 exact matches in the general handwritten-expression pilot; targeted photographed-work accuracy remains unverified. History slider lacks deterministic reducer/WebSockets.

## Pending Features

Hosted Neon/R2 verification; targeted handwritten-photo benchmark; broader symbolic curriculum; mastery/remediation; real-time/replay; retention/deletion; deployment, load tests and live acceptance.

## Known Bugs

Student assignment parameter exposure is fixed locally with an explicit field projection; two database regressions verify that server/teacher snapshots remain intact. See [[Known-Issues]].

Importer rejected digit-bearing identifiers such as sha256; fixed in 88487d7 with actual PostgreSQL preservation regression. See [[Regression-History]]. Existing OCR segmentation and accuracy limitations remain documented in [[OCR-Model-Comparison]].

## Current Blockers

No remaining filesystem, Git, network or browser restriction observed. Cloud credentials/resources are absent. Hosted database/storage/inference transport, cost and deployment remain unverified.

## Important Architecture Decisions

Modular monolith, exact bounded math, explicit student confirmation, immutable evaluation/review provenance. SQLite default; DATABASE_URL selects Neon. Jobs run in a separate Node process with 90-second leases and at most three attempts. Inference runs outside database transactions. No deployed Cloudflare queue consumer is claimed. See [[OCR-Pipeline]] and [[ADR-0005-Async-Persistence]].

## Required Environment Variables

TRACELAB_DB_PATH (use the same absolute path for API and worker) or DATABASE_URL. TRACELAB_PUBLIC_ORIGIN for hosted CSRF/cookie origin. Optional CLOUDFLARE_ACCOUNT_ID/R2_BUCKET/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY as specified in .env.example. TRACELAB_OCR_URL and TRACELAB_OCR_TOKEN enable experimental extraction; run the Python service and pnpm ocr:worker separately. CHROMIUM_PATH optionally selects installed Chromium. Keep secrets/private data ignored.

## Exact Next Steps

1. Commit/push the student projection fix, pass checks, merge and verify main.
2. Begin TASK-0022 persisted exactly-once mastery and prerequisite-aware remediation. Teacher review corrections must replace one evidence item rather than count as new attempts; unconfirmed/unsupported work must not silently update mastery.
3. Continue real-time/replay and production work in [[Master-Roadmap]]. Cloud credentials and targeted photographed-work validation remain open.

## Recovery Procedure

Read [[00-START-HERE]], this note, [[Recovery-Instructions]] and ledger; inspect status/log/remote. Original verified backup recovery/tracelab-baseline-20261009T000129Z.tar.gz SHA-256 acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc contains the original 150 files/84 notes. Git preserves subsequent work. Use Node 22 LTS, frozen pnpm install and versioned SQL migrations. Do not recreate the baseline. The original queue stash remains as an extra local recovery copy; its restored work is committed and pushed in 8893999.

Earlier preview checkpoint: http://127.0.0.1:3000 returned HTTP 200 and the guided-demo control was visible in Chromium. The local experimental OCR service listens on 127.0.0.1:8020. Preview processes are session-local; restart with [[Local-Development]] and the OCR service README when needed. The source archive hash was rechecked unchanged at this checkpoint.
