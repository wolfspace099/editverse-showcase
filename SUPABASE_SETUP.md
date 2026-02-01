# Supabase Database Setup

## Fix "experience_level column not found" Error

Run this SQL in your Supabase SQL Editor:

```sql
-- Ensure the applications table has all required columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'applications' AND column_name = 'age'
  ) THEN
    ALTER TABLE applications ADD COLUMN age INTEGER;
  END IF;
END $$;

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
```

## Alternative: Drop and Recreate (⚠️ This will delete all application data)

If the above doesn't work, you can drop and recreate the table:

```sql
DROP TABLE IF EXISTS applications CASCADE;

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  
  -- Application data
  full_name TEXT NOT NULL,
  age INTEGER,
  experience_level TEXT NOT NULL CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', 'Professional')),
  why_join TEXT NOT NULL,
  portfolio_url TEXT,
  social_links JSONB DEFAULT '{}',
  editing_software TEXT[],
  goals TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  
  -- Metadata
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own application" ON applications
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create own application" ON applications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own pending application" ON applications
  FOR UPDATE USING (auth.uid()::text = user_id::text AND status = 'pending');

CREATE POLICY "Admins can view all applications" ON applications
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can update all applications" ON applications
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();
```
