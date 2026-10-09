CREATE TABLE ocr_jobs (
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
CREATE INDEX ocr_jobs_pending ON ocr_jobs(status,available_at,lease_until);
CREATE INDEX ocr_jobs_submission ON ocr_jobs(submission_id,created_at);
CREATE UNIQUE INDEX ocr_jobs_active ON ocr_jobs(submission_id) WHERE status IN ('QUEUED','RUNNING');
