# Database Architecture

The API now accepts one asynchronous database interface backed by local SQLite or Neon PostgreSQL. SQLite retains its existing schema, foreign keys, WAL and data files. PostgreSQL migration 0001 preserves current question/evaluation snapshots and relationships. Request transactions include authorization and domain events, and roll back even when Hono converts an exception into an error response. Connection contexts are isolated; simultaneous creates, edits and confirmation retries are tested on both local engines.

PostgreSQL write transactions use a shared advisory lock for the small demo; read transactions use repeatable snapshots. This favors correctness over throughput and requires future measured refinement. Migrations record checksums and reject changed history. A guarded SQLite importer requires an empty target, preserves records and sequence ordering, and leaves the source unchanged. See [[ADR-0005-Async-Persistence]], [[Database-Schema]] and [[Local-Development]].

PostgreSQL behavior is verified using PGlite, not a hosted Neon account. Image bytes still reside privately in the selected database; R2 integration follows. Full curriculum/mastery/OCR entities remain pending.

## Private image references

Migration 0002 adds image_references without changing existing image BLOBs. Configured R2 uploads store only immutable keys, size/hash and MIME in PostgreSQL/SQLite; reads remain authorized API requests. Legacy bytes can be moved by an explicit dry-run-first command. See [[ADR-0006-Private-Object-Storage]].
