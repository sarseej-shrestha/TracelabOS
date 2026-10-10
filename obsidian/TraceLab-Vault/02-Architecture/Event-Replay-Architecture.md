# Event Replay Architecture

`domain_events` stores an increasing global sequence, unique event ID, classroom ID, optional submission ID, type, compact payload, and timestamp. Existing events remain unchanged. `classroom-milestones-1` orders projected metadata by sequence, deduplicates identical public events and rejects conflicting IDs/sequences. Input order and clock skew cannot select a different outcome.

The reducer reconstructs assignment publication, latest recorded submission state and latest released teacher decision at an event-count position. It understands manual entry, OCR queue/start/retry/failure/completion, confirmation, evaluation and feedback events. Corrected reviews replace the projected decision without increasing submission counts. It does not recreate photos, draft edits, absent events or prior evaluations. Unknown event types, invalid payloads, missing starts and unobserved state transitions produce explicit warnings. A recorded state can be shown despite an incomplete earlier path; it is not proof that all earlier transitions were valid.

Global sequence gaps are normal because classrooms share a database sequence. The reducer does not label gaps as missing classroom data. It detects a missing start and some missing transitions, but cannot prove that every historical record exists, especially if a complete record was removed before capture. No hash-chain or per-classroom contiguous sequence is claimed.

The owner-only `/api/classrooms/:id/event-history` endpoint returns at most 100 events, a stable `through` cursor, total count, next cursor and hasMore. Every subsequent page is filtered by classroom and the original cursor. New appends wait until a refresh. The client verifies fixed metadata, forward progress, identity consistency and final count; a mismatched/partial snapshot fails instead of appearing complete. Metadata is an explicit bounded allowlist; images, names, transcription and future fields are excluded. Original stored payloads are preserved. Histories beyond 10,000 events return an explicit limit error; archival/windowed replay is future work.

Teacher UI now uses this paginated snapshot and reconstructs milestones while scrubbing with a keyboard-accessible slider. Current dashboard values remain separate from historical projections. Context changes clear previous classroom data and stale loads cannot replace a newer result. Live subscription/reconnection is a separate task, documented in [[Real-Time-Architecture]].

Related: [[00-START-HERE]] · [[Current-State]] · [[API-Contracts]]
