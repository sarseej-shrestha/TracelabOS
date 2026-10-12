# Deployment Guide

The existing application is publicly deployed on Workers and Neon; use the verified procedure below. The original Node-only edge-runtime blocker was resolved by preserving the Hono API on Neon Node Functions. Local SQLite remains a development mode, never an ephemeral production database.

Related: [[00-START-HERE]] · [[Current-State]]

## Existing Neon verification — 2026-10-10

The existing project is on Neon Free and already has Object Storage enabled; no additional project was created. Five checksum-protected SQL migrations were applied after verifying an empty public schema, using the existing pooled connection. `pnpm db:smoke --write-demo` explicitly creates isolated fictional records and verifies the current workflow through the real Neon transport. It requires DATABASE_URL and does not initialize an unknown schema. Records are retained, never truncated. The repeated migrations make no changes. This is an API/transport check, not a deployed browser test.

Local credentials are in ignored `.env.cloud.local` with mode 0600. Load them using Node's `--env-file=.env.cloud.local`; never copy their contents into documentation or logs. Cloudflare Wrangler 4.149.0 and Neon CLI 8.3.5 browser authorization succeeded with macOS Keychain storage. The exposed database password was rotated through the authorized Neon API and the local URL replaced atomically. No hosted secret existed at rotation time. Do not reuse the original password.

At the earlier database-only checkpoint, cloud deployment was pending. Current official [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) specify 100,000 requests/day and 10ms CPU/request on Free; native server dependencies and password/image CPU costs require runtime verification. [OpenNext](https://opennext.js.org/cloudflare) supports Next 16; [vinext 1.0](https://blog.cloudflare.com/vinext-nextjs-on-vite/) is another current option. No framework migration or billing activation has occurred. [Neon Object Storage](https://neon.com/blog/building-neon-object-storage) uses S3-compatible access with visibility managed through Neon, not S3 ACLs. Free allowances are not unlimited or a perpetual hosting guarantee.

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

### Database transport verification

After TASK-0025 deployment, the Node adapter requires verified TLS and channel binding for every PostgreSQL connection. Load DATABASE_URL securely and run pnpm db:tls-smoke; it performs a read-only query and records only protocol/proof status. Query flags cannot weaken the policy; sslmode=require or verify-full and channel_binding=require are the only accepted options. No new SQL migration or password rotation is required for this driver change.

## Checked automatic releases — TASK-0026

The deployment workflow listens for a successful Engineering checks run on main from the official repository, or an explicit main-only dispatch. It resolves the exact successful SHA, verifies that it is still remote main, checks out that SHA without persisted Git credentials, reruns application/browser/build gates, and rechecks main immediately before publishing. Superseded runs cannot publish. A failed engineering run cannot start deployment. Publishing secrets remain scoped to provider steps.

Both providers receive TRACELAB_RELEASE_SHA. The public health body reports the backend release, and x-tracelab-worker-release identifies the Worker. scripts/cloud-release-smoke.mjs requires both to match the selected SHA before the public browser suite runs. Local publishing helpers reject mismatched SHA or uncommitted source/dependency/application-data changes. They allow only explicitly listed generated browser reports/screenshots, which are not application inputs. This avoids discarding verification evidence or mislabeling unreviewed source as a release.

First run results and exact deployment IDs are recorded in [[Change-Ledger]]. Automatic activation is complete only after the checked workflow has actually run successfully. The initial trigger did not apply migrations. TASK-0029 adds checksum-verified migrations before publication; no workflow changes service billing plans.

## Verified automatic release

2026-10-11: GitHub run 38176846122 (triggered by successful main checks 38176615632) deployed exact main 49c10be to both services. Neon API version 4; Worker 945329de-a2a5-4baf-a220-d0ccdb967c0a. Release smoke confirms both SHAs and PostgreSQL/private storage. All 1,602 unit/integration tests, 18 local browser tests (35.4s), build/audit checks and 5 public browser workflows (34.3s) pass. No new schema or paid service. Public OCR remains unavailable. Safe evidence: artifacts/cloud-release-smoke.json and artifacts/cloud-browser-results.json.

## Durable public-demo budgets — TASK-0029

Migration 0006 adds four fixed resource counters, each with a UTC day, daily usage and lifetime usage. No account, image, grade or history is removed. SQLite version six preserves existing data; imports preserve existing counters and accept earlier databases without that table. Hosted Neon enables enforcement unconditionally. Local mode opts in with TRACELAB_DEMO_BUDGETS=1; Playwright always enables it in its isolated SQLite database.

| Resource                             | Daily attempts/units |      Lifetime units |
| ------------------------------------ | -------------------: | ------------------: |
| Mutations except logout              |                2,000 |              50,000 |
| New identities (two per guided demo) |                  100 |               1,000 |
| Password login/registration attempts |                  500 | No separate ceiling |
| Photo-processing attempts            |                   20 |                 128 |

Reservations commit before request work in a separate short transaction. Failed validation, incorrect credentials, invalid images and interrupted uploads remain charged; there is no automatic refund or reset-on-restart. Multiple requested resources reserve atomically in a stable order. Rejected reservations leave no partial counter increments. Clock rollback cannot reopen a previous allowance. Daily limits reset only on a later UTC day; lifetime limits require an operator capacity review, with no public reset endpoint. Origins and body-size validation precede reservations. Unauthenticated attempts may consume this shared protective budget; it is a conservative circuit breaker, not a fair per-person allocation or DoS immunity.

The upload ceiling bounds at most 640 MiB of newly attempted 5 MiB objects since activation, including replacement/orphan attempts; existing objects are additional. It is not a provider usage meter. GET/HEAD, logout and static pages remain accessible through existing authentication/edge limits. Photo-only exhaustion keeps manual entry available. Other exhausted mutation budgets temporarily prevent writes; messages explain midnight UTC or operator review. Read traffic, provider compute/egress, existing data and direct operator tools still require monitoring. Retention/deletion and account-wide billing guarantees are not claimed.

Verification: 36 new dual-database/migration cases; all 1,638 unit/integration tests pass. The real Neon smoke created a uniquely owned temporary schema: two independent pools made sixteen concurrent reservations, exactly five succeeded and eleven were rejected. No partial charges; reconnect/UTC rollover/lifetime ceilings verified. Temporary schema removed, no production records or budgets changed. Evidence: artifacts/neon-budget-smoke.json; reproduce with `node --env-file=.env.cloud.local --experimental-transform-types scripts/budget-smoke.ts` under Node 22. Never print or commit the environment file.

The deploy workflow applies checksum-verified migrations after source/quality gates and before publishing. Migration output lists actual applied/unchanged versions without credentials. Before rolling back code, retain additive migration 0006 and its counters; older code ignores this table. Production activation and browser acceptance are pending checked merge.

## Release propagation gate — TASK-0030

Automatic run 38177734175 published API version 5 and Worker f6d45cad-76fa-4509-8497-de334b2943d2. At 2026-10-11 21:49:28 UTC, CI saw API b42e065 but Worker 49c10be and failed before browser tests. A separate DFW public probe at 21:50:08 UTC saw both b42e065. This shows transient version skew at the original probe, not a measured global propagation duration. Original evidence is retained in artifacts/cloud-propagation-delay.json. The old script checked only once immediately after publication.

The corrected gate polls the fixed public health endpoint for at most 90 seconds/18 requests, with at most ten seconds per request and five-second spacing. It still requires HTTP 200, healthy Neon PostgreSQL/private Neon storage and both exact selected SHAs. Redirects are rejected, response bodies limited to 16 KiB, and an overdue success cannot pass. Reports retain only validated operational fields, HTTP status, safe error categories, elapsed time and valid SHA values; arbitrary response bodies/errors are excluded. No provider deploy is retried by polling.

A second defect was confirmed by downloading the failed run's artifact: it contained the older 21:36 success report for 49c10be because the assertion failed before writing new evidence. Both cloud workflows now remove inherited reports immediately after checkout. The smoke also clears its old report and writes actual failed-attempt evidence before returning nonzero. A skipped browser step therefore supplies no report for the new run.

Fifteen new regression cases cover immediate success, API/Worker skew, permanent mismatch, unhealthy/public persistence, HTTP/network/JSON failures, response-size limits, overdue responses, safe diagnostics and malformed selected SHAs. All 1,617 tests on the fix branch pass; typecheck/lint pass. A new live probe on 2026-10-12 at 03:32 UTC verifies both b42e065 in one request (2.206s). This is current-health verification, not post-upload propagation measurement. Checked rollout remains pending. Quota feature 2304080 is preserved separately and not yet deployed.

## Backend artifact identity

The backend build embeds the source commit and writes release.json with the commit, clean-source flag and SHA-256 of index.mjs. Development builds with uncommitted edits are permitted but cannot publish. After committing, rebuild; publication rejects old, modified or dirty entry bundles before contacting a provider. Runtime configuration must equal the compiled revision or the backend returns 503. This supplements the unchanged public gate that checks both live commits.

The Neon control-plane completed state is not sufficient live acceptance: run 38225838986 observed the previous API revision throughout its bounded release gate, then a later direct probe converged. Keep failed evidence, investigate current control-plane/direct/public identities, and use the public-only browser workflow when both services actually converge. Do not call a failed deployment workflow successful. See [[Regression-History]]. Official lifecycle/status reference: [Neon deployment states](https://neon.com/docs/compute/functions/deploy).
