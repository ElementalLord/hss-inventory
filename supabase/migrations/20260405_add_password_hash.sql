-- Add persistent password storage for app users
-- Run this in Supabase SQL editor or via CLI:
--   supabase db query ./supabase/migrations/20260405_add_password_hash.sql
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash TEXT;
