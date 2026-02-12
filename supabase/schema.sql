-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Editing course',
  image_url TEXT NOT NULL,
  video_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  duration_minutes INTEGER,
  lessons_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_published BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0
);

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User progress
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_lesson_id UUID REFERENCES lessons(id),
  completed BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Lesson completions
CREATE TABLE lesson_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- User stats
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  skill_level TEXT DEFAULT 'Beginner',
  current_level INTEGER DEFAULT 1,
  max_level INTEGER DEFAULT 5,
  courses_completed INTEGER DEFAULT 0,
  courses_in_progress INTEGER DEFAULT 0,
  total_watch_time_minutes INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  last_activity_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin emails (dynamic admin allowlist)
CREATE TABLE IF NOT EXISTS admin_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

CREATE UNIQUE INDEX IF NOT EXISTS admin_emails_email_lower_key
  ON admin_emails (lower(email));

-- Indexes
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX idx_lesson_completions_user_id ON lesson_completions(user_id);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_emails ENABLE ROW LEVEL SECURITY;

-- Policies

-- Admin helper based on email claim in JWT
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(coalesce(auth.jwt() ->> 'email', '')) IN ('wolfspace099@gmail.com')
    OR EXISTS (
      SELECT 1
      FROM admin_emails ae
      WHERE lower(ae.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

INSERT INTO admin_emails (email)
VALUES ('wolfspace099@gmail.com')
ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Admins can view admin emails" ON admin_emails;
CREATE POLICY "Admins can view admin emails" ON admin_emails
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert admin emails" ON admin_emails;
CREATE POLICY "Admins can insert admin emails" ON admin_emails
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete admin emails" ON admin_emails;
CREATE POLICY "Admins can delete admin emails" ON admin_emails
  FOR DELETE USING (public.is_admin());

-- Courses: everyone can read published courses
DROP POLICY IF EXISTS "Anyone can view published courses" ON courses;
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

-- Courses: admin access (email-based)
DROP POLICY IF EXISTS "Admins have full access to courses" ON courses;
CREATE POLICY "Admins have full access to courses" ON courses
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Lessons: read lessons of published courses
DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON lessons;
CREATE POLICY "Anyone can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = lessons.course_id AND courses.is_published = true
    )
  );

-- Lessons: admin access (for course management)
DROP POLICY IF EXISTS "Admins have full access to lessons" ON lessons;
CREATE POLICY "Admins have full access to lessons" ON lessons
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- User progress: users can only read/write their own
CREATE POLICY "Users can manage own progress" ON user_progress
  FOR ALL USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Lesson completions: users can only read/write their own
CREATE POLICY "Users can manage own lesson completions" ON lesson_completions
  FOR ALL USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- User stats: users can only read/write their own
CREATE POLICY "Users can manage own stats" ON user_stats
  FOR ALL USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Add course_chapters table for organizing lessons into chapters
CREATE TABLE IF NOT EXISTS course_chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add chapter_id to lessons table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'chapter_id'
  ) THEN
    ALTER TABLE lessons ADD COLUMN chapter_id UUID REFERENCES course_chapters(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_course_chapters_course_id ON course_chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_chapter_id ON lessons(chapter_id);

-- Enable RLS
ALTER TABLE course_chapters ENABLE ROW LEVEL SECURITY;

-- Policies for course_chapters
DROP POLICY IF EXISTS "Anyone can view chapters of published courses" ON course_chapters;
CREATE POLICY "Anyone can view chapters of published courses" ON course_chapters
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_chapters.course_id AND courses.is_published = true
    )
  );

DROP POLICY IF EXISTS "Admins have full access to chapters" ON course_chapters;
CREATE POLICY "Admins have full access to chapters" ON course_chapters
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own application
CREATE POLICY "Users can view own application" ON applications
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can create their own application
CREATE POLICY "Users can create own application" ON applications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own pending application
CREATE POLICY "Users can update own pending application" ON applications
  FOR UPDATE USING (auth.uid()::text = user_id::text AND status = 'pending');

-- Admins can view all applications
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
CREATE POLICY "Admins can view all applications" ON applications
  FOR SELECT USING (public.is_admin());

-- Admins can update all applications (for approval/rejection)
DROP POLICY IF EXISTS "Admins can update all applications" ON applications;
CREATE POLICY "Admins can update all applications" ON applications
  FOR UPDATE USING (public.is_admin());

-- Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS applications_updated_at ON applications;
CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();
