# Deployment Guide

Deployment is blocked and unattempted. First replace the local Node/SQLite/image adapters with tested edge-compatible PostgreSQL/R2/processing interfaces. Generate a pnpm lock; run typecheck/lint/unit/integration/build/browser/security checks; provision the selected free-tier account resources; apply versioned migrations; set secrets through the provider; deploy a preview; execute the genuine workflow against the live URL. Only then promote. Rollback must pin the previous artifact and preserve forward-compatible data. Do not deploy this Node database file as an ephemeral serverless filesystem.

Related: [[00-START-HERE]] · [[Current-State]]

## Existing Neon verification — 2026-10-10

The existing project is on Neon Free and already has Object Storage enabled; no additional project was created. Five checksum-protected SQL migrations were applied after verifying an empty public schema, using the existing pooled connection. `pnpm db:smoke --write-demo` explicitly creates isolated fictional records and verifies the current workflow through the real Neon transport. It requires DATABASE_URL and does not initialize an unknown schema. Records are retained, never truncated. The repeated migrations make no changes. This is an API/transport check, not a deployed browser test.

Local credentials are in ignored `.env.cloud.local` with mode 0600. Load them using Node's `--env-file=.env.cloud.local`; never copy their contents into documentation or logs. Cloudflare Wrangler 4.149.0 and Neon CLI 8.3.5 browser authorization succeeded with macOS Keychain storage. The exposed database password was rotated through the authorized Neon API and the local URL replaced atomically. No hosted secret existed at rotation time. Do not reuse the original password.

Cloud deployment remains pending. Current official [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) specify 100,000 requests/day and 10ms CPU/request on Free; native server dependencies and password/image CPU costs require runtime verification. [OpenNext](https://opennext.js.org/cloudflare) supports Next 16; [vinext 1.0](https://blog.cloudflare.com/vinext-nextjs-on-vite/) is another current option. No framework migration or billing activation has occurred. [Neon Object Storage](https://neon.com/blog/building-neon-object-storage) uses S3-compatible access with visibility managed through Neon, not S3 ACLs. Free allowances are not unlimited or a perpetual hosting guarantee.
