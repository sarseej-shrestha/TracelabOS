# Local Development

Use Node 22 LTS (22.13+) or Node 24 LTS with pnpm 10.28.2. Run `corepack pnpm install --frozen-lockfile`, then `pnpm verify`. `pnpm dev` starts development; `pnpm start` serves a production build. SQLite lives under the Next app working directory `.data` unless TRACELAB_DB_PATH supplies an absolute path. Use fictional records only. See [[Environment-Variables]].

The old npm lockfile is retained in the baseline commit and recovery archive, not used for current installs. An online npm optional-dependency deduplication crash was resolved by adopting the declared pnpm workspace manager and one pinned sharp version. CI uses frozen installs and Node 22.

## PostgreSQL mode and migration

Set DATABASE_URL securely to a Neon connection string and run `pnpm db:migrate`. Configure the same variable in the application runtime. Run `pnpm db:import-sqlite` with TRACELAB_IMPORT_PATH only when importing an existing local database into an empty migrated target. Both commands fail rather than overwrite records. Stop local writes during a final cutover; compare row counts and browser behavior before retiring any copy. Without DATABASE_URL the existing SQLite mode remains active. Hosted execution has not been verified; integration tests run actual PostgreSQL through PGlite.

## Private object migration and reconciliation

With explicit TRACELAB_DB_PATH or DATABASE_URL and complete R2 credentials, run `pnpm images:migrate` to preview; add `--apply` for a bounded 100-image batch. Repeat until remaining is zero. Run `pnpm images:reconcile` to preview aged orphans; add `--delete` only after reviewing the count and keeping backups. Only unreferenced application objects older than 24 hours are eligible. Live provider execution is still pending credentials. See [[ADR-0006-Private-Object-Storage]].

## Experimental OCR and browser checks

Run the Python service and `pnpm ocr:worker` alongside Next with the same absolute TRACELAB_DB_PATH (or DATABASE_URL), TRACELAB_OCR_URL and shared token. See services/ocr-worker/README.md for pinned environment and queue recovery behavior. The real local service currently listens on 127.0.0.1:8020; the application preview is http://127.0.0.1:3000 while its process is running.

`pnpm test:e2e` now creates a separate ignored `.data/e2e-<pid>.db` and starts a deterministic test provider/worker on localhost:8031. It clears cloud configuration for the child processes and refuses to reuse an existing app server. Stop the local preview before running these tests, then restart it. Fixture responses are integration controls, not OCR benchmark results. `pnpm ocr:browser-smoke <image-path>` instead uses an already running actual local API/provider/worker; use non-sensitive research inputs and read the report limitations.

## Rebuilding historical mastery

Select exactly one existing TRACELAB_DB_PATH or DATABASE_URL. Apply schema migration 0004 or newer first; this command never initializes a database or runs migrations. Keep a private database backup before applying an operational repair.

```sh
pnpm mastery:rebuild
pnpm mastery:rebuild --apply
```

The default uses a read-only SQLite connection or PostgreSQL read-only snapshot and prints aggregate insert/update/removal counts. It does not print student names, work or credentials. Inspect `blocked`: malformed/unknown skills, invalid timestamps/decisions or missing evaluations prevent apply. The query selects each finalized submission's latest teacher review and the latest evaluation that existed at that review time. More than 10,000 reviewed submissions requires a separately designed bounded migration.

Apply acquires the database write transaction, recomputes the plan, and replaces only mastery_evidence and current bkt-reviewed-1 estimates if they differ. Original reviews/evaluations/events, recommendation snapshots and older model estimates remain untouched. A repeat with unchanged source is a no-op. Failure rolls back both projections. The local demo was backed up privately, one historical review was backfilled, all thirteen original data tables compared unchanged, and a second apply changed nothing; see artifacts/mastery-rebuild-smoke.json. Private backups remain ignored under apps/web/.data/backups, never in Git.
