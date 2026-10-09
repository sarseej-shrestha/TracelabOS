# Hosting Feasibility

Checked official sources on 2026-10-08. Cloudflare now recommends vinext for Next.js and describes it as beta; compatibility still needs project-level testing. OpenNext is an alternative path. Workers AI lists 10,000 neurons/day free; some models require paid billing. Queues lists 10,000 operations/day free and 24-hour retention; a normal write/read/delete uses three operations. SQLite-backed Durable Objects are available on Workers Free, with 100,000 requests/day and 13,000 GB-s/day. R2 standard storage has 10 GB-month, 1M class A and 10M class B monthly free allowances; do not infer a hard spending cap. Neon driver supports HTTP and WebSockets; an October 2026 official announcement increases free storage to 1 GB/project, while older pages still say 0.5 GB. Reconfirm console entitlements before provisioning. None of these services has been provisioned here. See [[References]].

Related: [[00-START-HERE]] · [[Current-State]]
