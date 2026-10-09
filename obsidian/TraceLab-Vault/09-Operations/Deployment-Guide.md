# Deployment Guide

Deployment is blocked and unattempted. First replace the local Node/SQLite/image adapters with tested edge-compatible PostgreSQL/R2/processing interfaces. Generate a pnpm lock; run typecheck/lint/unit/integration/build/browser/security checks; provision the selected free-tier account resources; apply versioned migrations; set secrets through the provider; deploy a preview; execute the genuine workflow against the live URL. Only then promote. Rollback must pin the previous artifact and preserve forward-compatible data. Do not deploy this Node database file as an ephemeral serverless filesystem.

Related: [[00-START-HERE]] · [[Current-State]]
