# Real Time Architecture

Current teacher progress uses explicit refresh over persisted API records. There is no WebSocket connection or Durable Object in this checkpoint. Planned deployment will authenticate classroom subscriptions, fan out metadata-only events, resume with a cursor, and reconcile with database snapshots. Photos and full transcription text must not enter classroom broadcast payloads.

Related: [[00-START-HERE]] · [[Current-State]]
