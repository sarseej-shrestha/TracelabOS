# ADR-0005 — Asynchronous PostgreSQL persistence

Status: implemented and locally verified, hosted connection pending credentials. Date: 2026-10-08.

Preserve the existing Hono handlers and SQLite data rather than creating a separate cloud application. A request-scoped asynchronous database facade delegates to SQLite or Neon Pool. AsyncLocalStorage keeps concurrent transaction clients isolated. Every request has a transaction; error responses roll back. SQLite uses FIFO connection exclusion. PostgreSQL reads use repeatable-read snapshots; writes acquire one transaction advisory lock for the small demo, including authorization/read-check-write logic. This deliberately bounds concurrency; measure lock wait and replace with narrower entity locks before larger classrooms. Statement timeout is 10s and lock timeout 5s. This is not evidence of production throughput.

DATABASE_URL explicitly selects Neon. Missing credentials leave local mode usable; connection failures never silently switch stores. Versioned SQL checksums detect migration drift. The import command requires an empty migrated target, reads SQLite in a snapshot, copies records atomically, preserves event/review ordering and resets sequence counters. It never deletes the source. Existing image bytes remain private database records until the next R2 task.

PGlite 0.5.8 executes actual PostgreSQL SQL locally; it does not prove Neon transport, pool behavior under network faults or cloud latency. Neon serverless 1.2.0 is the production driver. No database credential is configured and no hosted migration was executed. The application still requires a Node runtime for SQLite/sharp; Cloudflare Worker packaging is a separate unresolved deployment task.

Sources checked: [Neon driver transactions](https://github.com/neondatabase/serverless), [PGlite API](https://pglite.dev/docs/api). Related: [[Database-Architecture]], [[Database-Schema]], [[Current-State]].
