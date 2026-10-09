# Verified source recovery — 2026-10-08 (America/Chicago)

The original implementation was preserved before any migration or dependency installation. The archive contains 150 source/configuration/test/documentation/evidence files, including all 84 vault notes. It excludes installed dependencies, builds, local databases/photos, Git metadata, private environment files, and credential directories. Environment example files and the non-secret project `.npmrc` are retained. A recognizable credential-pattern scan found no matches; no credentials were copied from outside the workspace.

Archive: `tracelab-baseline-20261009T000129Z.tar.gz`

SHA-256:

```text
acd9b02518cc2d38254cba428e03acf00e10f3c399f0b0b895a11fca84da8bdc
```

The adjacent `.manifest.json` records each file's SHA-256 and size. The archive was extracted with Python tarfile's data filter to `/private/tmp/tracelab-restore-re4i2gyz/TracelabOS`; all paths, file sizes, and hashes matched. This temporary directory is a restore rehearsal in the same restricted environment, not a new Git-enabled environment. The durable backup is in this workspace; copy it to your chosen authorized environment before relying on temporary files.

A clean `npm ci --offline --cache /private/tmp/tracelab-npm --no-audit --no-fund` in the extracted tree installed 294 packages without modifying the lockfile. Its typecheck, lint, all 358 tests (including 5,000 property cases), and production build passed. Formatting and all 84 vault links passed. SymPy repeated 2,000 cases/6,000 comparisons with zero disagreements. Evidence is in `verification/summary.json` and `verification/verify.log`. Python 3.13.9/SymPy 1.14.0 was read from an existing environment; use the pinned requirements to recreate it elsewhere. Node 23.10.0 ran these checks and emitted dependency-engine warnings; continue with a supported even LTS version.

## Recovery completed after permissions changed

Git/GitHub authentication, networking, localhost and Chromium now work. One honest baseline import, 839d63439e9c2d5e3f800592cb68003bf1cec3c9, was pushed to the official repository and its files verified. Recovery PR #1 preserved task commits, fixed origin/contrast defects and dependency installation, passed GitHub checks, and merged as fce835835e3673ed901264ced80e6cddaeb75705. Do not initialize another repository or import another baseline.

The old permission diagnosis and baseline import instructions are historical evidence preserved in Git. Current development uses Node 22 LTS and frozen pnpm installs. All five real browser tests pass. Read the vault Current-State and inspect Git status/log/remote before resuming. The original archive remains unchanged; newer commits preserve subsequent work. Cloud credentials are still absent, so hosted database/OCR/deployment verification remains pending.
