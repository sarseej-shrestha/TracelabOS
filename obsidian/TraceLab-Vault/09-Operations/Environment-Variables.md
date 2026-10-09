# Environment Variables

TRACELAB_DB_PATH selects the local SQLite file, default .data/tracelab.db. CHROMIUM_PATH optionally selects a compatible installed browser for Playwright. NEXT_TELEMETRY_DISABLED=1 can disable framework telemetry. DATABASE_URL and CLOUDFLARE_ACCOUNT_ID in .env.example are future adapter configuration and are not consumed by this runtime. Never commit provider tokens, database credentials, sessions, photos, or local SQLite data.

Related: [[00-START-HERE]] · [[Current-State]]
