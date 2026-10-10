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
  transaction(db, () => {
    if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=4').get()) {
      db.exec(`CREATE TABLE skills (id TEXT PRIMARY KEY, title TEXT NOT NULL);
CREATE TABLE skill_prerequisites (skill_id TEXT NOT NULL REFERENCES skills(id), prerequisite_id TEXT NOT NULL REFERENCES skills(id), PRIMARY KEY(skill_id, prerequisite_id), CHECK(skill_id <> prerequisite_id));
INSERT INTO skills VALUES ('fraction-equivalence','Equivalent fractions');
INSERT INTO skills VALUES ('fraction-addition','Add unlike fractions');
INSERT INTO skills VALUES ('fraction-subtraction','Subtract fractions');
INSERT INTO skills VALUES ('fraction-multiplication','Multiply fractions');
INSERT INTO skills VALUES ('fraction-division','Divide by a fraction');
INSERT INTO skills VALUES ('mixed-number-addition','Add mixed numbers');
INSERT INTO skills VALUES ('arithmetic-expressions','Evaluate arithmetic expressions');
INSERT INTO skills VALUES ('combine-like-terms','Combine like terms');
INSERT INTO skills VALUES ('one-step-equations','Balance an equation');
INSERT INTO skills VALUES ('distributive-property','Distribute to every term');
INSERT INTO skills VALUES ('two-step-equations','Solve two-step equations');
INSERT INTO skills VALUES ('variables-both-sides','Variables on both sides');
INSERT INTO skills VALUES ('unit-rates','Find a unit rate');
INSERT INTO skills VALUES ('equivalent-ratios','Scale equivalent ratios');
INSERT INTO skills VALUES ('proportional-scaling','Read a proportional table');
INSERT INTO skills VALUES ('solve-proportions','Solve a proportion');
INSERT INTO skills VALUES ('percent-part-whole','Relate percent, part and whole');
INSERT INTO skills VALUES ('percent-change','Apply a percent change');
INSERT INTO skills VALUES ('rectangle-area','Find rectangle area');
INSERT INTO skills VALUES ('rectangle-perimeter','Find rectangle perimeter');
INSERT INTO skills VALUES ('triangle-area','Find triangle area');
INSERT INTO skills VALUES ('composite-area','Decompose composite area');
INSERT INTO skills VALUES ('missing-length','Recover a missing length');
INSERT INTO skills VALUES ('area-unit-conversion','Convert square metric units');
INSERT INTO skill_prerequisites VALUES ('fraction-addition','fraction-equivalence');
INSERT INTO skill_prerequisites VALUES ('fraction-subtraction','fraction-addition');
INSERT INTO skill_prerequisites VALUES ('fraction-multiplication','fraction-equivalence');
INSERT INTO skill_prerequisites VALUES ('fraction-division','fraction-multiplication');
INSERT INTO skill_prerequisites VALUES ('mixed-number-addition','fraction-addition');
INSERT INTO skill_prerequisites VALUES ('combine-like-terms','arithmetic-expressions');
INSERT INTO skill_prerequisites VALUES ('one-step-equations','arithmetic-expressions');
INSERT INTO skill_prerequisites VALUES ('distributive-property','combine-like-terms');
INSERT INTO skill_prerequisites VALUES ('distributive-property','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('two-step-equations','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('variables-both-sides','two-step-equations');
INSERT INTO skill_prerequisites VALUES ('variables-both-sides','distributive-property');
INSERT INTO skill_prerequisites VALUES ('unit-rates','fraction-division');
INSERT INTO skill_prerequisites VALUES ('equivalent-ratios','fraction-equivalence');
INSERT INTO skill_prerequisites VALUES ('equivalent-ratios','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('proportional-scaling','unit-rates');
INSERT INTO skill_prerequisites VALUES ('proportional-scaling','equivalent-ratios');
INSERT INTO skill_prerequisites VALUES ('solve-proportions','equivalent-ratios');
INSERT INTO skill_prerequisites VALUES ('solve-proportions','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('percent-part-whole','fraction-multiplication');
INSERT INTO skill_prerequisites VALUES ('percent-part-whole','one-step-equations');
INSERT INTO skill_prerequisites VALUES ('percent-change','percent-part-whole');
INSERT INTO skill_prerequisites VALUES ('rectangle-area','fraction-multiplication');
INSERT INTO skill_prerequisites VALUES ('rectangle-perimeter','arithmetic-expressions');
INSERT INTO skill_prerequisites VALUES ('triangle-area','rectangle-area');
INSERT INTO skill_prerequisites VALUES ('triangle-area','fraction-division');
INSERT INTO skill_prerequisites VALUES ('composite-area','rectangle-area');
INSERT INTO skill_prerequisites VALUES ('composite-area','fraction-subtraction');
INSERT INTO skill_prerequisites VALUES ('missing-length','rectangle-area');
INSERT INTO skill_prerequisites VALUES ('missing-length','rectangle-perimeter');
INSERT INTO skill_prerequisites VALUES ('missing-length','fraction-division');
INSERT INTO skill_prerequisites VALUES ('area-unit-conversion','rectangle-area');
INSERT INTO skill_prerequisites VALUES ('area-unit-conversion','equivalent-ratios');
CREATE TABLE mastery_evidence (
  submission_id TEXT PRIMARY KEY REFERENCES submissions(id),
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  review_id TEXT NOT NULL UNIQUE REFERENCES teacher_reviews(id),
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  outcome INTEGER CHECK(outcome IN (0,1)),
  observed_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX mastery_evidence_scope ON mastery_evidence(classroom_id,student_id,skill_id,observed_at,submission_id);
CREATE TABLE mastery_estimates (
  classroom_id TEXT NOT NULL REFERENCES classrooms(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  algorithm_version TEXT NOT NULL,
  probability DOUBLE PRECISION NOT NULL CHECK(probability>=0 AND probability<=1),
  evidence_count INTEGER NOT NULL CHECK(evidence_count>=0),
  correct_count INTEGER NOT NULL CHECK(correct_count>=0 AND correct_count<=evidence_count),
  updated_at TEXT NOT NULL,
  PRIMARY KEY(classroom_id,student_id,skill_id,algorithm_version)
);
CREATE INDEX mastery_student_scope ON mastery_estimates(student_id,classroom_id,skill_id);
`);
      db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(
        4,
        new Date().toISOString(),
      );
    }
  });
  transaction(db, () => {
    if (!db.prepare('SELECT 1 FROM schema_migrations WHERE version=5').get()) {
      db.exec(`CREATE TABLE recommendations (
  id TEXT PRIMARY KEY,
  source_submission_id TEXT NOT NULL UNIQUE REFERENCES submissions(id),
  assignment_id TEXT NOT NULL UNIQUE REFERENCES assignments(id),
  student_id TEXT NOT NULL REFERENCES users(id),
  review_id TEXT NOT NULL REFERENCES teacher_reviews(id),
  evaluation_id TEXT NOT NULL REFERENCES evaluations(id),
  skill_id TEXT NOT NULL REFERENCES skills(id),
  algorithm_version TEXT NOT NULL,
  reason TEXT NOT NULL,
  mastery_snapshot TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL
);
CREATE INDEX recommendations_student ON recommendations(student_id,created_at);
`);
      db.prepare('INSERT INTO schema_migrations VALUES(?,?)').run(
        5,
        new Date().toISOString(),
      );
    }
  });
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
