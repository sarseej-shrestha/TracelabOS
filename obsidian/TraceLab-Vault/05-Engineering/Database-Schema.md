# Database Schema

Implemented local tables: users, sessions, classrooms, classroom_memberships, assignments, submissions, submission_images, transcription_versions, evaluations, teacher_reviews, domain_events, schema_migrations. Question snapshots are JSON in assignments; line arrays are JSON in immutable transcription versions. This is a deliberately smaller local schema, not the full normalized PostgreSQL target. Required future entities include persisted skills/prerequisites/templates/questions, assignment_questions, ocr_jobs, transcription_lines, step_evaluations, misconceptions, mastery_estimates, recommendations, and audit_logs. No production SQL migration has been applied.

Related: [[00-START-HERE]] · [[Current-State]]

## PostgreSQL migration 0001

The same current relational entities are now implemented in packages/database/migrations/0001_postgresql.sql and tested using PostgreSQL/PGlite. Sessions use BIGINT expiry; images use BYTEA; event sequence and review rowid use SERIAL for stable order. Existing text JSON snapshots remain intentional; this is not yet the full normalized target described above. PostgreSQL migration checksums are recorded and enforced. No hosted migration has been run. See [[ADR-0005-Async-Persistence]].

## Image references migration 0002

image_references has submission primary/foreign key, unique object key, JPEG MIME constraint, bounded positive byte count, SHA-256 and timestamp. SQLite upgrades retain existing BLOBs and record migration 2; PostgreSQL migrations keep immutable checksums. The SQLite importer tolerates a pre-v2 source and preserves any references present in newer sources.

## Reviewed mastery migration 0004

Implemented skills (24 seeded IDs/titles), skill_prerequisites (foreign keys and no self-edge), mastery_evidence (one row per submission, foreign keys to classroom/student/skill/review/evaluation, nullable binary outcome, original observation time) and mastery_estimates (classroom/student/skill/algorithm-version key, bounded probability, nonnegative evidence/correct counts). Scope/time indexes support ordered replay. SQLite applies the upgrade transactionally once; PostgreSQL uses the checksum runner. Import preserves present evidence/estimates and accepts pre-mastery sources without inventing history. Seeded catalog rows are not user data and do not prevent an otherwise empty-target import. Existing pre-upgrade reviews are retained; backfill is pending. No hosted migration has been run.
