# API verification

The current API is `services/api/src/app.ts`, mounted at `/api` by Next.js. The local runtime uses Node APIs and SQLite; it is not a deployed Worker.

Boundary schemas: `packages/contracts/src/index.ts`. All mutations require an `Origin` matching the request origin. Use the HttpOnly session cookie from login/registration or the isolated fictional demo. Object lookups enforce ownership/membership and return scoped 404 responses.

Important sequence:

1. `POST /api/submissions` with `assignmentId` creates/reuses the student's submission.
2. `PATCH /api/submissions/:id/transcription` with `version` and `lines` appends a draft version.
3. `POST /api/submissions/:id/confirm` with the new `version` and `confirmed: true` commits grading once.
4. `GET /api/submissions/:id` returns feedback only when permitted by the assignment policy.
5. Owner teacher `POST /api/submissions/:id/reviews` appends a judgment/reason and releases feedback without erasing the automatic evaluation.

Raw image upload: `POST /api/submissions/:id/image`, `Content-Type: image/png` or `image/jpeg`, maximum 5 MiB and 16 million decoded pixels. Stored data is normalized JPEG; retrieval requires ownership and is non-cacheable. OCR is unavailable and never silently simulated.

See the Obsidian API-Contracts note for the remaining route inventory and known pagination limitations.
