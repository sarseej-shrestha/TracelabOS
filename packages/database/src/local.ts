import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
/** Local adapter only. PostgreSQL is a separate deployment milestone. */
export function openDatabase(path: string) {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, password_hash TEXT, role TEXT NOT NULL CHECK(role IN ('teacher','student')), demo_space TEXT, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS classrooms (id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS classroom_memberships (classroom_id TEXT NOT NULL REFERENCES classrooms(id), user_id TEXT NOT NULL REFERENCES users(id), PRIMARY KEY(classroom_id,user_id));
    CREATE TABLE IF NOT EXISTS assignments (id TEXT PRIMARY KEY, classroom_id TEXT NOT NULL REFERENCES classrooms(id), title TEXT NOT NULL, question TEXT NOT NULL, feedback TEXT NOT NULL CHECK(feedback IN ('immediate','teacher')), due_at TEXT, published_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS submissions (id TEXT PRIMARY KEY, assignment_id TEXT NOT NULL REFERENCES assignments(id), student_id TEXT NOT NULL REFERENCES users(id), state TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, UNIQUE(assignment_id, student_id));
    CREATE TABLE IF NOT EXISTS submission_images (submission_id TEXT PRIMARY KEY REFERENCES submissions(id), mime TEXT NOT NULL, bytes BLOB NOT NULL);
    CREATE TABLE IF NOT EXISTS transcription_versions (submission_id TEXT NOT NULL REFERENCES submissions(id), version INTEGER NOT NULL, lines TEXT NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(submission_id,version));
    CREATE TABLE IF NOT EXISTS evaluations (id TEXT PRIMARY KEY, submission_id TEXT NOT NULL REFERENCES submissions(id), transcription_version INTEGER NOT NULL, engine_version TEXT NOT NULL, result TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(submission_id,transcription_version,engine_version));
    CREATE TABLE IF NOT EXISTS teacher_reviews (id TEXT PRIMARY KEY, submission_id TEXT NOT NULL REFERENCES submissions(id), teacher_id TEXT NOT NULL REFERENCES users(id), decision TEXT NOT NULL, reason TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS domain_events (sequence INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, classroom_id TEXT NOT NULL REFERENCES classrooms(id), submission_id TEXT REFERENCES submissions(id), type TEXT NOT NULL, payload TEXT NOT NULL, created_at TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS assignments_classroom ON assignments(classroom_id,published_at);
    CREATE INDEX IF NOT EXISTS submissions_assignment ON submissions(assignment_id,created_at);
    CREATE INDEX IF NOT EXISTS events_classroom_sequence ON domain_events(classroom_id,sequence);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS reviews_submission ON teacher_reviews(submission_id,created_at);
    CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS image_references (submission_id TEXT PRIMARY KEY REFERENCES submissions(id), object_key TEXT NOT NULL UNIQUE, mime TEXT NOT NULL CHECK(mime='image/jpeg'), byte_length INTEGER NOT NULL CHECK(byte_length>0 AND byte_length<=5242880), sha256 TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS ocr_jobs (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES submissions(id),
  request_key TEXT NOT NULL,
  input_version INTEGER NOT NULL CHECK(input_version>0),
  image_sha256 TEXT NOT NULL,
  provider_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts>=0 AND attempts<=3),
  lease_token TEXT,
  lease_until BIGINT NOT NULL DEFAULT 0,
  available_at BIGINT NOT NULL DEFAULT 0,
  raw_output TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(submission_id,request_key)
);
CREATE INDEX IF NOT EXISTS ocr_jobs_pending ON ocr_jobs(status,available_at,lease_until);
CREATE INDEX IF NOT EXISTS ocr_jobs_submission ON ocr_jobs(submission_id,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS ocr_jobs_active ON ocr_jobs(submission_id) WHERE status IN ('QUEUED','RUNNING');
    INSERT OR IGNORE INTO schema_migrations VALUES (3, datetime('now'));
    INSERT OR IGNORE INTO schema_migrations VALUES (2, datetime('now'));
    INSERT OR IGNORE INTO schema_migrations VALUES (1, datetime('now'));
  `);
  return db;
}
export type DB = ReturnType<typeof openDatabase>;
export function transaction<T>(db: DB, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
