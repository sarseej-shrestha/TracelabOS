# Experimental local OCR boundary

The authenticated Python service runs the measured Pix2Text-MFR-1.5 candidate on localhost. It proposes bounded single-column regions, recognizes each crop, returns actual pixel-derived bounding boxes, and requires confirmation. No confidence or grading is generated. Its small general-handwriting pilot was poor; this is an experimental correction aid, not production-approved OCR.

Install the separate Python 3.13 candidate environment from `research/ocr-benchmarks/requirements-pix2text-lock.txt`. Configure a random TRACELAB_OCR_TOKEN of at least 32 characters through the environment, then run:

```sh
python services/ocr-worker/python/server.py
```

It binds only 127.0.0.1:8020 (TRACELAB_OCR_PORT can change the port). Configure TRACELAB_OCR_URL=http://127.0.0.1:8020/transcribe and the same token for the TypeScript adapter. `pnpm ocr:smoke <non-sensitive-image-path>` verifies unauthorized rejection and typed extraction, storing an honest provider-only report. No credentials are written to reports.

Images are limited to JPEG/PNG, 5 MiB and 16 megapixels; model inputs are reduced to 2000px. Region proposals are limited to 20, output text to 512 characters per line, and response reads to 128 KiB. Ambiguous layout, crossed-out work, perspective distortion and closely spaced steps remain limitations. Every recognition result needs human review; unsupported LaTeX remains unconverted instead of silently losing symbols.

## Durable application worker

Apply PostgreSQL migration 0003 with `pnpm db:migrate` before starting a hosted API; SQLite upgrades non-destructively on open. Configure the API and worker with the same database, provider URL/token, and optional R2 configuration. Start the Python inference service, then run `pnpm ocr:worker` in a separate process. Select an explicit absolute TRACELAB_DB_PATH (the web default is relative to apps/web) or DATABASE_URL. `pnpm ocr:worker --once` processes at most one eligible job for a reproducible smoke test.

POST `/api/submissions/:id/process` accepts `{version,idempotencyKey}`. Only the submission owner may enqueue; each UUID key is replay-safe. The API stores jobs and returns 202 without waiting for inference. A worker claims a 90-second lease under the database transaction, loads the private image and calls the model outside that transaction, then atomically appends a transcription version. Original structured output, image hash and model version remain on the job. Successful extraction moves to CONFIRMATION_REQUIRED; grading still requires explicit student confirmation. Invalid provider output ends in EXTRACTION_FAILED. Provider errors/timeouts retry up to three claims with 20/40-second backoff. Expired leases are recoverable and late worker results are rejected. Cancellation through POST `/manual-entry` with `{version}` retains saved work.

Persisted rolling-day caps allow five jobs per student and 200 across the demo. Automatic attempts are bounded to three per job. There is one active job per submission. Quota exhaustion and missing providers preserve manual entry. Different worker model versions do not claim one another's jobs: finish or cancel old jobs when upgrading.

This is a database-backed local/Node worker, not a deployed Cloudflare queue consumer. The browser processing controls are the next task. Production hosting, targeted photographed handwriting acceptance, distributed rate limiting and automatic retention remain incomplete.

`pnpm ocr:workflow-smoke <non-sensitive-image-path>` runs an isolated in-memory application workflow against the configured real model, then deliberately substitutes a labeled distribution fixture to verify confirmation, grading and teacher review. It writes artifacts/ocr-workflow-smoke.json. This validates integration, never recognition accuracy; the executed research input is recorded in the vault Test-Results.
