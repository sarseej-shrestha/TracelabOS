# Environment Variables

TRACELAB_DB_PATH selects the local SQLite file (default .data/tracelab.db). DATABASE_URL, when nonempty, selects Neon PostgreSQL instead; migrate it explicitly before starting. TRACELAB_IMPORT_PATH supplies the existing SQLite file to the one-time import command. Never point it at the only copy without preserving the verified backup. TRACELAB_PUBLIC_ORIGIN is the single trusted public browser origin for cookie/CSRF handling. Local defaults allow localhost/127.0.0.1 port 3000; hosted mode needs its actual HTTPS origin.

CHROMIUM_PATH optionally selects an installed browser. NEXT_TELEMETRY_DISABLED=1 disables telemetry. Cloudflare/R2 credentials are not yet consumed. Never commit credentials, sessions, photos or databases. The command-line database scripts read environment variables, not .env files automatically; configure them securely in the shell or secret manager. Next uses its normal app environment-file loading.

Related: [[Local-Development]] · [[Current-State]]

## R2

Set CLOUDFLARE_ACCOUNT_ID (32 hex characters), R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY together. Use a bucket-scoped read/write token; disable public bucket access. Blank R2 configuration keeps private database storage active. A partial credential set fails startup, and missing credentials for an existing R2 reference yield 503 rather than substitute another image. Never place real values in .env.example.

## Experimental local OCR

TRACELAB_OCR_URL selects the operator-controlled inference endpoint; HTTP is allowed only on loopback and other endpoints require HTTPS. TRACELAB_OCR_TOKEN is a random shared secret of at least 32 characters used by the Python service and adapter. TRACELAB_OCR_PORT changes the localhost server port (default 8020). Partial configuration fails closed. These settings do not yet enable durable application processing; that integration follows.
