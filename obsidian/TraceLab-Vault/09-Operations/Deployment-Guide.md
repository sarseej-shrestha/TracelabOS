# Deployment Guide

Deployment is blocked and unattempted. First replace the local Node/SQLite/image adapters with tested edge-compatible PostgreSQL/R2/processing interfaces. Generate a pnpm lock; run typecheck/lint/unit/integration/build/browser/security checks; provision the selected free-tier account resources; apply versioned migrations; set secrets through the provider; deploy a preview; execute the genuine workflow against the live URL. Only then promote. Rollback must pin the previous artifact and preserve forward-compatible data. Do not deploy this Node database file as an ephemeral serverless filesystem.

Related: [[00-START-HERE]] · [[Current-State]]

## Existing Neon verification — 2026-10-10

The existing project is on Neon Free and already has Object Storage enabled; no additional project was created. Five checksum-protected SQL migrations were applied after verifying an empty public schema, using the existing pooled connection. `pnpm db:smoke --write-demo` explicitly creates isolated fictional records and verifies the current workflow through the real Neon transport. It requires DATABASE_URL and does not initialize an unknown schema. Records are retained, never truncated. The repeated migrations make no changes. This is an API/transport check, not a deployed browser test.

Local credentials are in ignored `.env.cloud.local` with mode 0600. Load them using Node's `--env-file=.env.cloud.local`; never copy their contents into documentation or logs. Cloudflare Wrangler 4.149.0 and Neon CLI 8.3.5 browser authorization succeeded with macOS Keychain storage. The exposed database password was rotated through the authorized Neon API and the local URL replaced atomically. No hosted secret existed at rotation time. Do not reuse the original password.

Cloud deployment remains pending. Current official [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) specify 100,000 requests/day and 10ms CPU/request on Free; native server dependencies and password/image CPU costs require runtime verification. [OpenNext](https://opennext.js.org/cloudflare) supports Next 16; [vinext 1.0](https://blog.cloudflare.com/vinext-nextjs-on-vite/) is another current option. No framework migration or billing activation has occurred. [Neon Object Storage](https://neon.com/blog/building-neon-object-storage) uses S3-compatible access with visibility managed through Neon, not S3 ACLs. Free allowances are not unlimited or a perpetual hosting guarantee.

## Private storage verification

`pnpm storage:smoke --write-fixture` creates one controlled object, verifies signed read/list, checks anonymous rejection, then deletes only that object. `pnpm db:smoke --write-demo` now uses configured image storage and records the provider. On 2026-10-10 both passed against Neon; anonymous object access returned 403. Existing private database bytes are still readable; `pnpm images:migrate` is a dry run and `--apply` performs bounded, transactional migration. `pnpm images:reconcile` is dry-run by default; `--delete` removes only unreferenced objects older than 24 hours. No automatic retention scheduler is deployed yet.

Provisioning used official Neon CLI 8.3.5 with explicit existing project/branch arguments, `buckets create tracelab-submissions --access-level private` and a named credential with only storage scopes. No Neon project was created. The existing uploads bucket remains untouched. [Authentication contract](https://neon.com/docs/storage/authentication) requires path-style S3 addressing; provider credentials are branch-scoped, not individual student credentials. Object ownership is enforced by the application.

## Public deployment — 2026-10-11

The verified public origin is https://tracelabos.sarseej-shrestha.workers.dev. Worker `tracelabos` serves Next/OpenNext and forwards API requests through a private bridge to Neon function `tracelabapi` on the existing production branch. See [[ADR-0006-Free-Cloud-Runtime]] for measured compatibility, quotas and limitations. No paid service was activated. The Cloudflare OAuth token cannot read billing subscriptions (HTTP 403); the user reported Workers Free, and no plan-changing operation was made.

Build with Node 22 and the frozen pnpm lockfile:

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm audit --audit-level=high
pnpm build:api
pnpm build:cloud
```

`build:api` bundles application code and installs only the measured Linux arm64 Sharp dependencies from `services/api/deployment/package-lock.json`. Its cross-platform npm `--force` permits installing Linux binaries on a Mac; it does not skip tests or audits. The provider limits archives to 10 MiB compressed. Never copy `.env` or the workspace into the function archive.

Authenticate the pinned CLIs with `pnpm exec wrangler login --use-keyring` and `pnpm exec neonctl login --keyring`. Load the ignored owner-only environment using Node's `--env-file=.env.cloud.local` when invoking `scripts/deploy-neon-api.mjs` and `scripts/deploy-cloudflare.mjs`. The first deploys the fixed existing project/branch/function with required server environment variables. The second sends only the bridge secret via a temporary mode-0600 Wrangler secrets file and removes it afterward. DATABASE_URL and storage credentials belong only to the Neon backend. Neither helper claims success without subsequent live verification.

Run `TRACELAB_CLOUD_URL=https://tracelabos.sarseej-shrestha.workers.dev pnpm test:cloud` after deployment. It creates fictional accounts and records; no school/student data is used. Tests exercise actual images and sessions, including rendered teacher images and anonymous API image rejection. Local Playwright clears cloud storage variables and uses isolated SQLite databases. Live OCR is disabled; local experimental OCR tests do not imply hosted inference.

Rollback: preserve the preceding Worker version and Neon function deployment ID before publishing. Use Wrangler rollback for the exact previous Worker version; for the API, rebuild/deploy the preceding verified Git commit using the same locked native package. Do not roll back database migrations by deleting tables. These changes did not introduce new SQL migrations. A rollback still requires health, authentication/image authorization and browser checks. Current identifiers are in the development ledger; never use a probe version as a product rollback target.

The `Deploy verified cloud demo` workflow is initially manual and restricted to main. It reruns checks/build/browser verification before publishing and runs the public browser suite afterward. Secrets are attached only to the two deployment steps, never test steps. Automatic main deployment will be enabled only after its durable provider credentials and first end-to-end workflow execution have been verified. Do not claim this workflow has run merely because the YAML exists.
