# Deployment Architecture

The public manual-transcription workflow runs at https://tracelabos.sarseej-shrestha.workers.dev. Worker tracelabos serves Next.js 16/OpenNext and proxies the fixed private backend. Neon function tracelabapi runs the unchanged native Hono/image/authentication stack on Node 24/Linux arm64 in the existing project. PostgreSQL requires verified TLS and SCRAM-SHA-256-PLUS; private objects are served only through authorized API reads. Local SQLite remains usable.

GitHub checks verify TypeScript, lint, formatting, unit/integration/property tests, Python oracles, local browser workflows and both production builds. Only a successful current-main check can trigger publication. Exact release SHA metadata is required from both services before five public browser workflows run. The release gate now allows bounded propagation while retaining strict acceptance; failures preserve safe observations and never reuse old reports. TASK-0029 adds checksum-verified migrations before publication. No workflow upgrades billing plans.

Actual provider versions and acceptance outcomes belong in [[Current-State]] and [[Change-Ledger]], not static assumptions here. Hosted OCR, automatic retention and load acceptance are still pending. See [[ADR-0006-Free-Cloud-Runtime]], [[Deployment-Guide]] and [[Hosting-Feasibility]].
