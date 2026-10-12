# Environment Variables

TRACELAB_DB_PATH selects the local SQLite file (default .data/tracelab.db). DATABASE_URL, when nonempty, selects Neon PostgreSQL instead; migrate it explicitly before starting. TRACELAB_IMPORT_PATH supplies the existing SQLite file to the one-time import command. Never point it at the only copy without preserving the verified backup. TRACELAB_PUBLIC_ORIGIN is the single trusted public browser origin for cookie/CSRF handling. Local defaults allow localhost/127.0.0.1 port 3000; hosted mode needs its actual HTTPS origin.

CHROMIUM_PATH optionally selects an installed browser. NEXT_TELEMETRY_DISABLED=1 disables telemetry. Cloudflare/R2 credentials are not yet consumed. Never commit credentials, sessions, photos or databases. The command-line database scripts read environment variables, not .env files automatically; configure them securely in the shell or secret manager. Next uses its normal app environment-file loading.

Related: [[Local-Development]] · [[Current-State]]

## R2

Set CLOUDFLARE_ACCOUNT_ID (32 hex characters), R2_BUCKET, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY together. Use a bucket-scoped read/write token; disable public bucket access. Blank R2 configuration keeps private database storage active. A partial credential set fails startup, and missing credentials for an existing R2 reference yield 503 rather than substitute another image. Never place real values in .env.example.

## Experimental local OCR

TRACELAB_OCR_URL selects the operator-controlled inference endpoint; HTTP is allowed only on loopback and other endpoints require HTTPS. TRACELAB_OCR_TOKEN is a random shared secret of at least 32 characters used by the Python service and adapter. TRACELAB_OCR_PORT changes the localhost server port (default 8020). Partial configuration fails closed. These settings do not yet enable durable application processing; that integration follows.

## Private Neon Object Storage

Configure NEON_STORAGE_BUCKET, NEON_STORAGE_ENDPOINT, NEON_STORAGE_REGION, NEON_STORAGE_ACCESS_KEY_ID and NEON_STORAGE_SECRET_ACCESS_KEY together. Never combine with R2 variables. Endpoint and region must match the existing branch storage API; HTTPS and a Neon storage hostname are required. The access ID maps to the scoped Neon token_id; the secret maps to s3_secret_access_key. Use only storage:read/storage:write permissions. The server owns the credential and authorizes each image read; browsers receive no storage credential. Keep values in ignored local files and deployment secrets. Current private bucket: tracelab-submissions.

## Worker/Neon bridge

TRACELAB_BACKEND_URL is the fixed HTTPS Neon function endpoint; TRACELAB_PUBLIC_ORIGIN is the exact public Workers origin. Both are non-secret Worker configuration. TRACELAB_BRIDGE_SECRET is a cryptographically generated 64-hex-character infrastructure credential configured on both runtimes; browsers never receive it. Existing user sessions still authorize application objects. DATABASE_URL and the five NEON_STORAGE variables are configured only on the backend. Do not copy the entire local environment into the Worker. The deployed function currently overrides DATABASE_URL explicitly, so future password rotation must update that function environment too.

CI additionally requires a project-scoped NEON_API_KEY, CLOUDFLARE_API_TOKEN with this account's Workers deployment permission, and non-secret CLOUDFLARE_ACCOUNT_ID. CLI OAuth credentials remain local in Keychain. Do not put OAuth refresh tokens in the repository or logs.

## Release automation

TRACELAB_RELEASE_SHA is a non-secret 40-character Git commit supplied to both deployment steps. Publishing helpers verify it against the checkout. Backend health and the Worker response header expose only this release identity. CLOUDFLARE_API_TOKEN and the project-scoped NEON_API_KEY are encrypted GitHub secrets, as are DATABASE_URL, NEON_STORAGE_ACCESS_KEY_ID, NEON_STORAGE_SECRET_ACCESS_KEY and TRACELAB_BRIDGE_SECRET. CLOUDFLARE_ACCOUNT_ID is a repository variable. Provider secrets are never attached to test/build steps.

TRACELAB_DEMO_BUDGETS=1 enables the hosted policy in local Next.js development. Default local behavior is unchanged. Neon Functions always enforce the policy; no secret or account identifier is stored in the budget table.
