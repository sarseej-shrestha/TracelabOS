# Local Development

Use Node 22 LTS (22.13+) or Node 24 LTS with pnpm 10.28.2. Run `corepack pnpm install --frozen-lockfile`, then `pnpm verify`. `pnpm dev` starts development; `pnpm start` serves a production build. SQLite lives under the Next app working directory `.data` unless TRACELAB_DB_PATH supplies an absolute path. Use fictional records only. See [[Environment-Variables]].

The old npm lockfile is retained in the baseline commit and recovery archive, not used for current installs. An online npm optional-dependency deduplication crash was resolved by adopting the declared pnpm workspace manager and one pinned sharp version. CI uses frozen installs and Node 22.

## PostgreSQL mode and migration

Set DATABASE_URL securely to a Neon connection string and run `pnpm db:migrate`. Configure the same variable in the application runtime. Run `pnpm db:import-sqlite` with TRACELAB_IMPORT_PATH only when importing an existing local database into an empty migrated target. Both commands fail rather than overwrite records. Stop local writes during a final cutover; compare row counts and browser behavior before retiring any copy. Without DATABASE_URL the existing SQLite mode remains active. Hosted execution has not been verified; integration tests run actual PostgreSQL through PGlite.
