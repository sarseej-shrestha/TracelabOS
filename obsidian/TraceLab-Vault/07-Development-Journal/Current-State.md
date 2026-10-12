# TraceLab OS — Current State

Checkpoint: 2026-10-11 America/Chicago. The public manual-transcription workflow is functional; the full requested product is incomplete.

## Current Development Phase

Cloud integration and deployment of the existing workflow, prioritized by the user ahead of live classroom synchronization.

## Active Task

TASK-0029: durable public-demo budgets now integrated with the release fix and passing 1,653 unit/integration tests plus an isolated two-pool Neon concurrency smoke. Twenty local browser workflows now pass with enforcement enabled; OpenNext build and formatting/actionlint pass. Production activation awaits checked merge. TASK-0030 fix f0b4ebc passed CI and merged as 10e4532; its automatic release is pending. Original incident: automatic run 38177734175 observed the old Worker SHA immediately after upload while the API had the new SHA; a later public probe observes both at b42e065. No propagation duration is inferred from those two observations.

## Current Git Branch

security/durable-demo-budgets; quota feature 2304080 now incorporates synchronized main 10e4532e2d04f032c215808841f11deafec1dd85 (PR #30). Documentation conflicts preserve both complete task records.

## Latest Commit Hash

Remote main 10e4532 (PR #30), release fix f0b4ebc537045c6d15216cb1c02e8ef500529bf7. Quota feature 2304080 and research f24b7c7 remain preserved.

## Latest Successful Push

Hosted OCR research f24b7c7 passed all CI checks in run 38177283896 before PR #29 ordinary merge. Source is visible remotely at b42e065. Post-merge quality passed; automatic release 38177734175 failed its immediate Worker SHA check, skipping public browser acceptance. Later health reports both providers at b42e065. Release fix PR #30 passed run 38200254164 (verify 2m55s, oracle 54s, OCR metrics 8s) and merged normally. Budget changes are not deployed.

## Latest Verified Test Results

Latest automation branch: 1,602 tests pass, including 35 TLS/protocol/pool regressions and 14 release-source/health cases. Typecheck, lint, formatting, API/OpenNext builds and dependency audit pass. Real Neon probe verifies TLS 1.3 and SCRAM-SHA-256-PLUS; existing cloud storage/API smoke passes with the replacement driver. The TLS driver is already deployed as API version 3. Automatic rollout and exact release metadata are now verified in run 38176846122. The new research suite adds nineteen tests: 37 Python benchmark tests pass; with region tests, 43 pass. Earlier phase evidence follows.

1,510 Vitest tests pass, including 9,500 seeded property cases and 26 new dual-database OCR job cases. Strict TypeScript, ESLint and production build pass. Eighteen Chromium workflows pass (22.2s), including extraction, correction, cancellation, failure fallback, teacher provenance and axe accessibility. Independent mastery Decimal oracle: 2,047 sequences, zero disagreements; twelve adaptive Python tests now pass. Synthetic comparison: 240 held-out learners, 34,690 predictions, 5,760 practice choices; hashes/metrics reproduced under Python 3.13. Current replay CI also passes all 24 OCR metric/region tests, ten symbolic-oracle unit tests and twelve adaptive Python tests; fraction oracle reports 1,800 cases/11,700 comparisons and algebra reports 1,800/11,400, and ratios 1,800/11,850, zero disagreements; quantity oracle 2,000 cases, zero disagreements; geometry oracle 1,800 cases/10,800 comparisons, zero disagreements; ten oracle unittest cases pass. SymPy CI repeats 2,000 cases/6,000 comparisons with zero differences. Actual model API smoke processed the research image in 100.57ms. A separate Chromium workflow through the actual local model completed in 1465.52ms, left evaluation null until explicit correction/confirmation, detected fixture first error at step 2, and recorded a teacher review. This is workflow evidence, not camera-image accuracy.

## Completed Features

Recovery backup/hash/extraction, authorized Git/GitHub and localhost/browser access. Persistent authentication, classroom enrollment/assignments, private validated photos, versioned transcription, rational/affine verification and error propagation, teacher reviews/release and event history. SQLite local mode; Neon adapter/migrations and private R2 adapter tested locally. Actual experimental OCR provider, measured 72-image pilot per model, authenticated service, durable job leases/retries/cancellation/quotas, raw-output provenance, explicit confirmation before grading. Import regression fixed without losing data.

## Partially Completed Features

Twenty-four skills/forty-eight active templates cover four scoped units. Geometry is connected to unit-aware API/browser grading and known SVG figures; broader symbolic formulas remain unsupported. Provisional classroom-scoped BKT mastery from reviewed submissions, corrected/retracted evidence and transitive prerequisites now verified locally; targeted remediation now passes the full browser workflow; historical rebuild and local backfill now verified; synthetic strategy comparison now verified; interactive experiment view now verified locally; real-data calibration pending. OCR API/worker and browser processing/correction/fallback controls connected. Experimental model had only 3/72 exact matches in the general handwritten-expression pilot; targeted photographed-work accuracy remains unverified. Deterministic milestone reducer and snapshot pagination are merged after local/CI verification; WebSockets remain pending.

## Pending Features

Hosted OCR and targeted handwritten-photo benchmark; broader symbolic curriculum; live synchronization and archived replay beyond the 10,000-event bound; global usage budgets; retention/deletion; load tests and full photo-to-OCR acceptance. Cloud manual-transcription workflow is publicly deployed and browser-verified.

## Known Bugs

Student assignment parameter exposure is fixed and merged with an explicit field projection; two database regressions verify that server/teacher snapshots remain intact. See [[Known-Issues]].

Importer rejected digit-bearing identifiers such as sha256; fixed in 88487d7 with actual PostgreSQL preservation regression. See [[Regression-History]]. Existing OCR segmentation and accuracy limitations remain documented in [[OCR-Model-Comparison]].

## Current Blockers

No remaining filesystem, Git, network or browser restriction observed. Neon connection and Cloudflare/Neon management authorization now work. Both CLI credentials use macOS Keychain. Five migrations are applied to the existing Neon production branch. The exposed database password was rotated and the ignored mode-0600 local URL updated. Worker tracelabos and Neon function tracelabapi are deployed. Five public Chromium workflows pass. Hosted OCR remains pending. Deployment credentials are configured; API version 3 requires verified TLS/SCRAM-PLUS. First CI public browser deadline is recorded, local full rerun passes, and phase-instrumented Linux rerun passes 5/5. Automatic publication is verified by run 38176846122; hosted OCR selection remains open.

## Important Architecture Decisions

Modular monolith, exact bounded math, explicit student confirmation, immutable evaluation/review provenance. SQLite default; DATABASE_URL selects Neon. Jobs run in a separate Node process with 90-second leases and at most three attempts. Inference runs outside database transactions. No deployed Cloudflare queue consumer is claimed. See [[OCR-Pipeline]] and [[ADR-0005-Async-Persistence]].

## Required Environment Variables

TRACELAB_DB_PATH (use the same absolute path for API and worker) or DATABASE_URL. TRACELAB_PUBLIC_ORIGIN for hosted CSRF/cookie origin. Optional CLOUDFLARE_ACCOUNT_ID/R2_BUCKET/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY as specified in .env.example. TRACELAB_OCR_URL and TRACELAB_OCR_TOKEN enable experimental extraction; run the Python service and pnpm ocr:worker separately. CHROMIUM_PATH optionally selects installed Chromium. Keep secrets/private data ignored.

## Exact Next Steps

1. Verify the automatic release of main 10e4532 with both SHAs and all five public browser workflows.
2. Finish PR #31 for durable budgets after combined checks pass; migration 0006 must run before publication. Verify public workflow and persistent counters without exhausting public capacity.
3. Continue targeted hosted OCR validation, retention and classroom live updates. Preserve original pilot failures and camera-photograph limitations.

## Recovery Procedure

Read [[00-START-HERE]], this note, [[Recovery-Instructions]] and ledger; inspect status/log/remote. Original verified backup recovery/tracelab-baseline-20261009T000129Z.tar.gz SHA-256 acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc contains the original 150 files/84 notes. Git preserves subsequent work. Use Node 22 LTS, frozen pnpm install and versioned SQL migrations. Do not recreate the baseline. The original queue stash remains as an extra local recovery copy; its restored work is committed and pushed in 8893999.

Earlier preview checkpoint: http://127.0.0.1:3000 returned HTTP 200 and the guided-demo control was visible in Chromium. The local experimental OCR service listens on 127.0.0.1:8020. Preview processes are session-local; restart with [[Local-Development]] and the OCR service README when needed. The source archive hash was rechecked unchanged at this checkpoint.

Latest preview check: 2026-10-10T21:22:37Z, localhost:3000 returned 200 and Chromium saw the guided-demo control; localhost:8020 returned the experimental model version. The durable worker is running in this session. The private local database backup described in [[Local-Development]] was integrity-checked before historical backfill; source records were preserved. Processes remain session-local.

The replay panel contrast regression is fixed; eighteen complete browser workflows now pass. Original archive hash was rechecked unchanged, and all 86 current vault notes have zero broken wiki links. See artifacts/replay-preview-smoke.json for the latest preview evidence.

Cloud checkpoint: the real Neon smoke verifies migration idempotency, 34 foreign keys, 41 indexes, confirmed first-error grading, teacher review, session/image/event persistence after reconnect and anonymous/foreign image denial. It uses fictional isolated records and a controlled blank image, not handwriting OCR. The first harness attempt reused a deliberately revoked role-switch session; corrected the harness to preserve independent sessions. Local baseline rerun: frozen install, typecheck/lint, 1,510 tests/9,500 seeded property cases, build and eighteen Chromium workflows (22.4s) pass. SymPy repeats 2,000 cases/6,000 comparisons with zero disagreements. See artifacts/neon-cloud-smoke.json and scripts/neon-smoke.ts. Public URL now verified below.

Storage checkpoint: existing Neon Free project/production branch, private tracelab-submissions bucket, storage-only scoped credentials. Real signed PUT/GET/LIST/DELETE pass, anonymous GET returns 403, and the actual Neon API workflow passes again using object storage. 1,532 tests pass, including 22 new provider/configuration cases; typecheck/lint pass. Existing local/R2 modes and old database images remain supported. No public photo URLs, new database project or paid service was introduced.

## Public deployment checkpoint

https://tracelabos.sarseej-shrestha.workers.dev — Worker version 176f1aaa-1bd9-4198-b57d-de0055514d12, Neon API function version 2 (Node 24.16.0/Linux arm64). Neon Postgres/private Object Storage health is verified. Five real public browser tests pass (28.9s); 1,553 unit/integration/security tests pass, plus 18 local browser tests (21.8s). Twenty public health samples: p50 123.33ms/p95 361.41ms, zero failures; not load/CPU measurements. Live OCR reports unavailable and manual entry works. See [[ADR-0006-Free-Cloud-Runtime]].

Deployment dependencies introduced a high-severity glob CLI advisory; frontend upload was stopped before publication, patched version 10.5.0 pinned, then audit/typecheck/lint/tests/build passed before upload. Newly introduced CLI low/moderate advisories were also patched; final audit result is recorded in the ledger. Runtime adapter edits preserve local SQLite and experimental OCR. CI now builds both deployment artifacts without credentials; authenticated deployment automation is still being prepared.

Latest deployment attempt: GitHub run 38155822011 published API version 3 and Worker d52154f5-74fc-41ec-91fd-1da99ba85932 from eb816f0. Health is 200; the required-channel-binding driver is deployed. Cloud browser acceptance was 4 passed/1 timed out. Focused local rerun passed 1/1 in 14.7s; local full rerun, independent Linux rerun, and the automatic deployment browser suite all pass. The original deadline remains unexplained and preserved. No paid service or schema change occurred.

Latest automatic deployment: run 38176846122 succeeded on 2026-10-11, API version 4 / Worker 945329de-a2a5-4baf-a220-d0ccdb967c0a, both release 49c10be. See artifacts/cloud-release-smoke.json and artifacts/cloud-browser-results.json. Hosted research pilot: 16 requests, 0/8 exact for each candidate, eight empty Moondream results and one invalid Mistral JSON response. No production OCR activation. See [[OCR-Benchmark-Results]].

Latest fix-branch verification: 1,617 tests pass, typecheck/lint pass; 15 new bounded release-gate cases. Current health smoke records both b42e065 on 2026-10-12 03:32 UTC. See [[Regression-History]] for the separate gate failure and safe evidence handling.
