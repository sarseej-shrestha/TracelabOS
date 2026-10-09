# Deployment status: not deployed

The current artifact is a verified Next.js Node build using local SQLite and sharp. It cannot run unchanged on Cloudflare Workers. No hosted PostgreSQL, R2 bucket, Queue, Durable Object, inference model, or public URL has been provisioned.

Run `npm run verify` locally. Then `npm run test:e2e` in an environment that allows listening on localhost and launching Chromium. CI executes these gates but has not run on GitHub because no push was possible.

Before Cloudflare deployment: implement and test edge adapters; validate the selected Next.js deployment path; migrate durable data to PostgreSQL; enforce R2 retention/quota rules; connect benchmarked inference; configure identity and secrets; run dependency audit, security/load/accessibility gates; deploy preview; verify the live workflow. Keep the previous artifact and forward-compatible migration plan for rollback.

Current documented hosting research and quotas are in the vault's Hosting-Feasibility note. There is deliberately no deployment job that publishes this development build while those requirements are incomplete.
