# Classroom transport boundary

This package is reserved for the Cloudflare Durable Object transport. No WebSocket server is implemented or deployed. The current application uses explicit refresh and persisted event history from the Hono API.

Before implementation: enforce classroom membership/ownership on subscription, resume from a cursor, reconcile with a persisted snapshot, deduplicate events, and keep photographs out of broadcast payloads. See the vault's Real-Time-Architecture and Event-Replay-Architecture notes.
