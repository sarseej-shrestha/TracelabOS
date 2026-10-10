CREATE TABLE recommendations (
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
