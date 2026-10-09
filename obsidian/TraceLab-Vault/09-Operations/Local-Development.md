# Local Development

Use Node 22 LTS (22.13+) or Node 24 LTS with pnpm 10.28.2. Run `corepack pnpm install --frozen-lockfile`, then `pnpm verify`. `pnpm dev` starts development; `pnpm start` serves a production build. SQLite lives under the Next app working directory `.data` unless TRACELAB_DB_PATH supplies an absolute path. Use fictional records only. See [[Environment-Variables]].

The old npm lockfile is retained in the baseline commit and recovery archive, not used for current installs. An online npm optional-dependency deduplication crash was resolved by adopting the declared pnpm workspace manager and one pinned sharp version. CI uses frozen installs and Node 22.
