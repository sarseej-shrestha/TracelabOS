# API Contracts

GET /api/health and /api/skills are public. POST /api/demo creates isolated fictional records. /api/auth/register, login, logout manage local sessions. /api/me returns a safe identity. /api/classrooms supports list/create; POST /api/classrooms/enroll takes a code. /api/questions previews generation. /api/assignments supports list/publish. /api/submissions creates one record per student/assignment. Submission routes expose GET, PATCH transcription, POST confirm/image/reviews, and GET image. Classroom routes expose submissions, analytics, and cursor-based events. Mutations require an Origin matching the request origin. Validation is in packages/contracts; contracts differ from representative target endpoints where documented.

Related: [[00-START-HERE]] · [[Current-State]]

## Durable OCR routes

Owner-only POST `/api/submissions/:id/process` requires positive `version` and UUID `idempotencyKey`; returns 202 with job id/status/idempotent. Missing image: 400; stale version/locked state/key reuse with conflicting version: 409; rolling-day quota: 429; provider absent: 503. GET submission includes provider availability and latest job status/original structured output for its existing authorized student/teacher audience. POST `/manual-entry` with current version cancels active work or exits review/failure without erasing prior transcription. The inference service is never exposed through an unauthenticated browser endpoint. See [[OCR-Pipeline]].
