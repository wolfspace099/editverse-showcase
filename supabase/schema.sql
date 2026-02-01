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

-- Course lessons/modules
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

-- User progress tracking
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

-- Lesson completion tracking
CREATE TABLE lesson_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- User stats/levels
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

-- Create indexes for better query performance
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX idx_lesson_completions_user_id ON lesson_completions(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- Public read access for published courses
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

-- Admin full access (you'll need to set up admin role)
-- To grant admin role: 
-- UPDATE auth.users SET raw_app_metadata_content = jsonb_set(COALESCE(raw_app_metadata_content, '{}'::jsonb), '{role}', '"admin"') WHERE email = 'your-email@example.com';
CREATE POLICY "Admins have full access to courses" ON courses
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can view all courses" ON courses
  FOR SELECT TO authenticated USING (true);

-- Public read access for lessons of published courses
CREATE POLICY "Anyone can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = lessons.course_id 
      AND courses.is_published = true
    )
  );

-- Admin full access to lessons
CREATE POLICY "Admins have full access to lessons" ON lessons
  FOR ALL TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Authenticated users can view all lessons" ON lessons
  FOR SELECT TO authenticated USING (true);

-- Users can only see and modify their own progress
CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all progress" ON user_progress
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can only see and modify their own lesson completions
CREATE POLICY "Users can view own lesson completions" ON lesson_completions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own lesson completions" ON lesson_completions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all lesson completions" ON lesson_completions
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Users can only see and modify their own stats
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert own stats" ON user_stats
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Admins can view all stats" ON user_stats
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Function to update user progress when lesson is completed
CREATE OR REPLACE FUNCTION update_user_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update progress percentage based on completed lessons
  UPDATE user_progress
  SET 
    progress_percentage = (
      SELECT ROUND((COUNT(lc.id)::FLOAT / 
        (SELECT COUNT(*) FROM lessons WHERE course_id = NEW.course_id)::FLOAT) * 100)
      FROM lesson_completions lc
      WHERE lc.user_id = NEW.user_id 
      AND lc.course_id = NEW.course_id
    ),
    last_accessed_at = NOW(),
    completed = (
      SELECT COUNT(lc.id) >= (SELECT COUNT(*) FROM lessons WHERE course_id = NEW.course_id)
      FROM lesson_completions lc
      WHERE lc.user_id = NEW.user_id 
      AND lc.course_id = NEW.course_id
    )
  WHERE user_id = NEW.user_id AND course_id = NEW.course_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update progress
CREATE TRIGGER lesson_completion_trigger
AFTER INSERT ON lesson_completions
FOR EACH ROW
EXECUTE FUNCTION update_user_progress();

-- Function to update course lessons count
CREATE OR REPLACE FUNCTION update_course_lessons_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE courses 
    SET lessons_count = lessons_count + 1 
    WHERE id = NEW.course_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE courses 
    SET lessons_count = lessons_count - 1 
    WHERE id = OLD.course_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update lessons count
CREATE TRIGGER update_lessons_count_trigger
AFTER INSERT OR DELETE ON lessons
FOR EACH ROW
EXECUTE FUNCTION update_course_lessons_count();

-- Function to initialize user stats
CREATE OR REPLACE FUNCTION initialize_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_stats (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Seed data for testing
INSERT INTO courses (title, description, category, image_url, difficulty, duration_minutes, lessons_count, order_index) VALUES
('Video Editing Foundations', 'Cut, trim and structure footage with a clean professional workflow.', 'Editing course', '/images/course-preview-1.jpg', 'Beginner', 180, 12, 1),
('Advanced Timeline & Layer Editing', 'Master complex timelines, blending modes and layered edits.', 'Editing course', '/images/course-preview-2.jpg', 'Advanced', 240, 15, 2),
('Motion Graphics For Editors', 'Create titles, lower thirds and animated overlays directly in your edits.', 'Editing course', '/images/course-preview-3.jpg', 'Intermediate', 200, 14, 3),
('Color Correction & Grading', 'Professional color workflows for cinematic editing projects.', 'Editing course', '/images/course-preview-4.jpg', 'Intermediate', 150, 10, 4),
('Audio Cleanup For Video Editors', 'Fix noise, balance dialogue and enhance sound directly in your edits.', 'Editing course', '/images/course-preview-5.jpg', 'Beginner', 120, 8, 5),
('Fast Editing With Keyboard Shortcuts', 'Speed up your entire editing workflow using pro shortcut setups.', 'Editing course', '/images/course-preview-6.jpg', 'Beginner', 90, 6, 6),
('Multi-Cam Editing Techniques', 'Edit interviews and live events using professional multi-camera workflows.', 'Editing course', '/images/course-preview-7.jpg', 'Advanced', 180, 11, 7),
('Storytelling Through Editing', 'Learn the art of narrative construction and emotional pacing.', 'Editing course', '/images/course-preview-8.jpg', 'Intermediate', 160, 12, 8),
('Effects and Transitions Mastery', 'Create seamless transitions and professional visual effects.', 'Editing course', '/images/course-preview-9.jpg', 'Advanced', 220, 16, 9),
('Export Settings and Optimization', 'Master export settings for different platforms and formats.', 'Editing course', '/images/course-preview-10.jpg', 'Beginner', 60, 5, 10);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();