# Database Schema

Implemented local tables: users, sessions, classrooms, classroom_memberships, assignments, submissions, submission_images, transcription_versions, evaluations, teacher_reviews, domain_events, schema_migrations. Question snapshots are JSON in assignments; line arrays are JSON in immutable transcription versions. This is a deliberately smaller local schema, not the full normalized PostgreSQL target. Required future entities include persisted skills/prerequisites/templates/questions, assignment_questions, ocr_jobs, transcription_lines, step_evaluations, misconceptions, mastery_estimates, recommendations, and audit_logs. No production SQL migration has been applied.

Related: [[00-START-HERE]] · [[Current-State]]

## PostgreSQL migration 0001

The same current relational entities are now implemented in packages/database/migrations/0001_postgresql.sql and tested using PostgreSQL/PGlite. Sessions use BIGINT expiry; images use BYTEA; event sequence and review rowid use SERIAL for stable order. Existing text JSON snapshots remain intentional; this is not yet the full normalized target described above. PostgreSQL migration checksums are recorded and enforced. No hosted migration has been run. See [[ADR-0005-Async-Persistence]].
