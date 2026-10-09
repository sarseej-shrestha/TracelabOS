# Monitoring

GET /api/health performs a database query and reports local persistence, OCR availability, and version. Every API response has X-Request-Id; unknown failures emit minimal structured error logs without photographs or passwords. Full operation-duration, queue-job, engine-version, model-version, and retry observability remains pending. Establish SLOs only after measuring real deployed behavior.

Related: [[00-START-HERE]] · [[Current-State]]
