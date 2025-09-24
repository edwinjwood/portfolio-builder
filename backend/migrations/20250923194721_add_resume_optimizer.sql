-- 20250923194721_add_resume_optimizer.sql
-- Describe: Add tables for resume optimizer: profiles, resumes, resume_jobs, peer_sets
BEGIN;

-- Profiles table stores user-entered profile data
CREATE TABLE IF NOT EXISTS profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  degree TEXT,
  target_title TEXT,
  target_industry TEXT,
  strengths TEXT,
  about TEXT,
  certs_json JSONB,
  accomplishments_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resumes table stores metadata and internal storage paths per user
CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_path TEXT NOT NULL,
  extracted_text_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);

-- Jobs table to track analysis status and results
CREATE TABLE IF NOT EXISTS resume_jobs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id INTEGER NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('queued','running','done','error')),
  error_text TEXT,
  result_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_resume_jobs_user_id ON resume_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_jobs_resume_id ON resume_jobs(resume_id);

-- Peer sets of comparison resumes (admin managed)
CREATE TABLE IF NOT EXISTS peer_sets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('kaggle','uploaded')),
  path TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
