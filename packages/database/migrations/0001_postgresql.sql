-- Version 1: current application schema, preserving immutable question/evaluation snapshots.
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT, role TEXT NOT NULL CHECK(role IN ('teacher','student')), demo_space TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS classrooms (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS classroom_memberships (classroom_id TEXT NOT NULL REFERENCES classrooms(id), user_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(classroom_id,user_id));
CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL REFERENCES classrooms(id), title TEXT NOT NULL, question TEXT NOT NULL, feedback TEXT NOT NULL CHECK(feedback IN ('immediate','teacher')), due_at TEXT, published_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id), student_id TEXT NOT NULL REFERENCES users(id), state TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, UNIQUE(assignment_id, student_id));
CREATE TABLE IF NOT EXISTS submission_images (submission_id TEXT PRIMARY KEY REFERENCES submissions(id), mime TEXT NOT NULL, bytes BYTEA NOT NULL);
CREATE TABLE IF NOT EXISTS transcription_versions (submission_id TEXT NOT NULL REFERENCES submissions(id), version INTEGER NOT NULL, lines TEXT NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(submission_id,version));
CREATE TABLE IF NOT EXISTS evaluations (id TEXT PRIMARY KEY, submission_id TEXT NOT NULL REFERENCES submissions(id), transcription_version INTEGER NOT NULL, engine_version TEXT NOT NULL, result TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(submission_id,transcription_version,engine_version));
CREATE TABLE IF NOT EXISTS teacher_reviews (id TEXT PRIMARY KEY, submission_id TEXT NOT NULL REFERENCES submissions(id), teacher_id TEXT NOT NULL REFERENCES users(id), decision TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL, rowid SERIAL UNIQUE);
CREATE TABLE IF NOT EXISTS domain_events (sequence SERIAL PRIMARY KEY, id TEXT NOT NULL UNIQUE, classroom_id TEXT NOT NULL REFERENCES classrooms(id), submission_id TEXT REFERENCES submissions(id), type TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS assignments_classroom ON assignments(classroom_id,published_at);
CREATE INDEX IF NOT EXISTS submissions_assignment ON submissions(assignment_id,created_at);
CREATE INDEX IF NOT EXISTS events_classroom_sequence ON domain_events(classroom_id,sequence);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS reviews_submission ON teacher_reviews(submission_id,created_at);
