-- Add age column to applications table
ALTER TABLE applications ADD COLUMN IF NOT EXISTS age INTEGER;
