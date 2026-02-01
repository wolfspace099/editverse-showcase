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

-- Policies

-- Courses: everyone can read published courses
CREATE POLICY "Anyone can view published courses" ON courses
  FOR SELECT USING (is_published = true);

-- Courses: admin access
CREATE POLICY "Admins have full access to courses" ON courses
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Lessons: read lessons of published courses
CREATE POLICY "Anyone can view lessons of published courses" ON lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = lessons.course_id AND courses.is_published = true
    )
  );

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
