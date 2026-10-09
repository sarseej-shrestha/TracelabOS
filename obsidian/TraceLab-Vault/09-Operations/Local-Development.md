# Local Development

Use a supported Node 22.13+ or 24+ runtime; this environment has Node 23.10.0, which ran the checks but is outside some dependency engine ranges. pnpm 10.28.2 is intended. Offline fallback: npm ci --offline --cache <populated-writable-cache>, then npm run verify. npm run dev serves development and npm run start serves the production build. Both require localhost listen permission. SQLite lives under the Next app working directory .data unless TRACELAB_DB_PATH supplies an absolute path. Do not use real student information.

Related: [[00-START-HERE]] · [[Current-State]]
