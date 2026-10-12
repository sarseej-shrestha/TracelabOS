# Security Engineering

Implemented defenses: parameterized SQL, hashed session tokens, scrypt password hashes, strict cookies, same-origin mutation checks, teacher ownership checks, student ownership checks, per-process request caps, body limits, decoded-image normalization, pixel limits, private photo reads, and no-store responses. Remaining work includes CSP nonces, distributed limits/quotas, production identity, deletion/retention jobs, and full security review. The local demo is not approved for children’s data.

Related: [[00-START-HERE]] · [[Current-State]]

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
