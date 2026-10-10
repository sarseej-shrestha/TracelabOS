# Real Time Architecture

Current teacher progress uses explicit refresh over persisted API records. There is no WebSocket connection or Durable Object in this checkpoint. Planned deployment will authenticate classroom subscriptions, fan out metadata-only events, resume with a cursor, and reconcile with database snapshots. Photos and full transcription text must not enter classroom broadcast payloads.

Related: [[00-START-HERE]] · [[Current-State]]

TASK-0023A adds deterministic milestone reconstruction and fixed-cursor pagination to the existing refresh transport. It does not establish a live connection. The reusable history collector rejects changing or incomplete snapshots; future transport must retain this resynchronization path and owner authorization.
