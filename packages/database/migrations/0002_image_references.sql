CREATE TABLE image_references (
  submission_id TEXT PRIMARY KEY REFERENCES submissions(id),
  object_key TEXT NOT NULL UNIQUE,
  mime TEXT NOT NULL CHECK (mime = 'image/jpeg'),
  byte_length INTEGER NOT NULL CHECK (byte_length > 0 AND byte_length <= 5242880),
  sha256 TEXT NOT NULL,
  created_at TEXT NOT NULL
);
