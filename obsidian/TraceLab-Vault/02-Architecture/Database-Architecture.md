# Database Architecture

The API now accepts one asynchronous database interface backed by local SQLite or Neon PostgreSQL. SQLite retains its existing schema, foreign keys, WAL and data files. PostgreSQL migration 0001 preserves current question/evaluation snapshots and relationships. Request transactions include authorization and domain events, and roll back even when Hono converts an exception into an error response. Connection contexts are isolated; simultaneous creates, edits and confirmation retries are tested on both local engines.

PostgreSQL write transactions use a shared advisory lock for the small demo; read transactions use repeatable snapshots. This favors correctness over throughput and requires future measured refinement. Migrations record checksums and reject changed history. A guarded SQLite importer requires an empty target, preserves records and sequence ordering, and leaves the source unchanged. See [[ADR-0005-Async-Persistence]], [[Database-Schema]] and [[Local-Development]].

PGlite provides repeatable PostgreSQL tests in CI; real Neon verification is recorded below. Private image bytes now use the configured object-store adapter, while legacy database images remain readable.

## Private image references

Migration 0002 adds image_references without changing existing image BLOBs. Configured R2 uploads store only immutable keys, size/hash and MIME in PostgreSQL/SQLite; reads remain authorized API requests. Legacy bytes can be moved by an explicit dry-run-first command. See [[ADR-0006-Private-Object-Storage]].

## Hosted validation

The existing Neon Free database now has all five checksum-protected migrations. The real transport smoke verifies immutable grading/reviews and session/image/event persistence after reconnect. Private images can use Neon S3 storage through the same ImageStore contract as R2; database metadata retains ownership, byte length and SHA-256. Existing SQLite development data is unchanged. See [[Deployment-Guide]] for explicit smoke and migration commands.

## Required channel binding — TASK-0025

The Node backend now uses pg 8.23.1 with verified PostgreSQL TLS, SNI/hostname validation, TLS 1.2 minimum and mandatory SCRAM-SHA-256-PLUS. URL query parsing cannot override the SSL object; unsupported/duplicate options fail before connecting. The encrypted WebSocket driver was transport-secure but did not enforce the user's PostgreSQL channel-binding requirement.

pg's released enableChannelBinding option is opportunistic. ChannelBoundClient isolates version-pinned protocol hooks that reject cleartext, MD5, unbound SCRAM, authentication bypass, repeated exchanges and unverified server signatures. pg performs cryptography; the application does not implement its own production SCRAM. Independent local TLS protocol tests exercise real wire messages and certificate binding. Dependency upgrades must rerun them and the real Neon probe. Remove the compatibility guard only when a released, verified upstream require policy supplies equivalent protection.

Actual read-only Neon probe: TLS 1.3, certificate authorized, PLUS server proof verified. See artifacts/neon-tls-smoke.json and pnpm db:tls-smoke. The existing fictional workflow and migration checksum checks also pass with the new driver. Local SQLite and SQL transaction contracts remain unchanged. Production rollout is recorded in [[Change-Ledger]], not implied by this code description.

Primary sources: [node-postgres SSL configuration](https://node-postgres.com/features/ssl), [upstream require-policy proposal](https://github.com/brianc/node-postgres/pull/3746) (open, unmerged when checked 2026-10-11).
