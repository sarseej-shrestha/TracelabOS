# Regression History

BUILD-001: Next route and page imports traversed one parent directory too far. Typecheck/build reported unresolved packages. Corrected relative paths; strict typecheck and production build then passed.

BUILD-002: Next created a default app tsconfig with an older target and without allowImportingTsExtensions. Root typecheck passed while Next build failed. Root cause: app configuration did not inherit monorepo settings. Added apps/web/tsconfig.json extending the root strict ES2022 config; build passed.

INSTALL-001: offline npm peer resolution crashed and a transitive pure-rand tarball was absent. Used the documented legacy-peer-deps bootstrap, pinned the cached compatible pure-rand version, and verified installation. No online security audit was possible.

Related: [[00-START-HERE]] · [[Current-State]]

MATH-001: Review identified two fraction-classifier failures. The observed affine coefficient was ignored when matching a denominator-addition candidate, and a zero candidate denominator raised an exception before generic inequivalence could be reported. Added two explicit failing-case regressions, required a constant observation and nonzero candidate denominator, and reran the full suite successfully (358 tests). See [[Change-Ledger]] TASK-0005.
