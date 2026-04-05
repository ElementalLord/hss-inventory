-- Add password storage column for users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT;
