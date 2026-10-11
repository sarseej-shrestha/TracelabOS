# ADR-0006 — Free cloud runtime for the existing application

Date: 2026-10-11. Status: implemented and deployed; GitHub checks/merge follow. Related: [[Deployment-Guide]], [[Authentication-Architecture]], [[Database-Architecture]].

## Context and experiment

The existing API uses Node scrypt, Sharp/native libvips, and SQLite for local development. An unchanged Wrangler bundle succeeded but workerd initialization failed in Sharp's createRequire loader. A successful bundle alone therefore did not establish compatibility. Workers Free has 10ms HTTP CPU time, excluding network wait; reimplementing image decoding/password hashing to fit would risk changing established behavior.

OpenNext 1.20.10 supports the installed Next 16.3.8. Vinext 1.1.0 was evaluated as an alternative, but changing the frontend framework would not resolve these native API dependencies. Preserve Next/OpenNext and the existing Hono application. Serve the frontend and rate-limited private API bridge on Workers Free; run the existing API on the existing project's Neon Node.js Functions runtime, next to Postgres/private Object Storage. This is one codebase with an explicit deployment boundary, not a rewrite into independent feature services.

## Implementation

The Worker handles /api directly, with 120 requests/minute per IP per Cloudflare location, fixed HTTPS backend destination, origin checking, bounded declared body size and no redirect following. It adds a server-only 256-bit bridge credential. The backend compares it before opening application state; the existing user session, object authorization and CSRF checks still run. Browser cookies stay on the public origin. Raw photos never enter classroom events.

A Webpack alias replaces only the local Next API runtime adapter during the cloud build. Normal builds retain SQLite/local OCR support. No database or object credential is included in the Worker; the backend receives them via provider secrets. The bridge secret is sent through Wrangler's secrets-file mechanism. CLI credentials are in macOS Keychain; local values are ignored and mode 0600.

Neon rejects archives above 10 MiB compressed. The first package included both Linux architectures and was rejected at 16.7 MiB. An authenticated runtime probe measured Linux arm64, Node 24.16.0. The deployment package now locks only that architecture's Sharp/libvips dependencies. The temporary probe at function version 1 was replaced by the actual API at version 2. Native dependency licenses remain in the package.

## Verification and limits

The public application at https://tracelabos.sarseej-shrestha.workers.dev passed five Chromium workflows, including registration/login, classroom creation/enrollment, assignment publishing, controlled image upload/teacher inspection, confirmed grading, teacher review/release, reload persistence, keyboard navigation, mobile and axe checks. Direct backend access without the bridge returns 401. Actual Neon storage anonymous access returns 403. Controlled image fixtures are not handwritten OCR accuracy evidence.

Workers version 176f1aaa-1bd9-4198-b57d-de0055514d12 uploaded at 1,421.37 KiB gzip; measured Worker startup 19ms is startup time, not per-request CPU. Twenty sequential public health requests had p50 123.33ms/p95 361.41ms, zero failures; this includes network/DB latency and does not establish load capacity. Live OCR is disabled; manual transcription works. Local experimental OCR remains separate.

Neon Free currently includes 10 active/400 waiting Capacity-Hours and 1M function invocations/month, 5GB object storage, and 1GB Postgres/project. Workers Free has 100,000 requests/day. No paid plan or billing activation occurred. The rate limiter is per-location, not an exact global daily budget. Automatic retention, global demo budgets and load testing remain work. The database currently uses the previously implemented encrypted WebSocket driver; the URL retains channel_binding=require but SCRAM-PLUS negotiation has not been verified. A Node TCP adapter is the next security task to meet that stricter requirement explicitly.

## Sources checked

- https://opennext.js.org/cloudflare
- https://blog.cloudflare.com/vinext-nextjs-on-vite/
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- https://neon.com/docs/compute/functions/overview
- https://neon.com/docs/compute/functions/deploy
- https://neon.com/docs/compute/functions/reference/runtime-limits
- https://neon.com/docs/introduction/plans
