-- Ensure the applications table has all required columns
-- This migration is idempotent and can be run multiple times

-- Add age column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'age'
  ) THEN
    ALTER TABLE applications ADD COLUMN age INTEGER;
  END IF;
END $$;

-- Ensure experience_level column exists with proper constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'experience_level'
  ) THEN
    ALTER TABLE applications ADD COLUMN experience_level TEXT NOT NULL DEFAULT 'Beginner' CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', 'Professional'));
  END IF;
END $$;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
