# Classroom history and transport boundary

`src/replay.ts` implements deterministic recorded-milestone replay and bounded public metadata projection. `src/history.ts` collects a stable paginated snapshot and rejects truncation, conflicting identities and changed capture metadata. These are integrated with the owner-authorized Hono history endpoint and teacher timeline.

The live Cloudflare Durable Object/WebSocket transport remains unimplemented. Current progress uses explicit refresh. Future subscriptions must authorize ownership, resume from a cursor, reconcile with persisted snapshots and avoid photographs/transcription in broadcast payloads. See the vault Event-Replay-Architecture and Real-Time-Architecture notes for limits and acceptance.
