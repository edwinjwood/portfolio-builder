-- Add username, first_name, last_name to users table and unique index on username
BEGIN;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS username VARCHAR(100),
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- Ensure usernames are unique when present
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users (username) WHERE username IS NOT NULL;

COMMIT;
