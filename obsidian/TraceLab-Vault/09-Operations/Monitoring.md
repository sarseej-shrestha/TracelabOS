# Monitoring

GET /api/health performs a database query and reports the configured persistence/storage mode, OCR availability, version and selected backend release. The public bridge adds x-tracelab-worker-release. Health performs a real database read; it does not establish OCR accuracy or remaining provider quota. Every API response has X-Request-Id; unknown failures emit minimal structured error logs without photographs or passwords. Full operation-duration, queue-job, engine-version, model-version, and retry observability remains pending. Establish SLOs only after measuring real deployed behavior.

Related: [[00-START-HERE]] · [[Current-State]]

The release verifier retains bounded safe observations on failure or success. Migration logs report applied/unchanged versions without connection strings. Durable resource_budgets contains four counters with no personal identifiers; operator inspection must be read-only unless a reviewed capacity change is intended. Application quotas are not provider usage meters.
