# Database Schema

Implemented local tables: users, sessions, classrooms, classroom_memberships, assignments, submissions, submission_images, transcription_versions, evaluations, teacher_reviews, domain_events, schema_migrations. Question snapshots are JSON in assignments; line arrays are JSON in immutable transcription versions. This is a deliberately smaller local schema, not the full normalized PostgreSQL target. Required future entities include persisted skills/prerequisites/templates/questions, assignment_questions, ocr_jobs, transcription_lines, step_evaluations, misconceptions, mastery_estimates, recommendations, and audit_logs. No production SQL migration has been applied.

Related: [[00-START-HERE]] · [[Current-State]]
