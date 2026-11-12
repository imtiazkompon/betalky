-- ========================================================
-- beTalky Database Schema & Migrations
-- Run this in your Supabase SQL Editor
-- ========================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (User Profile & Fluency tracking)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  level TEXT DEFAULT 'Intermediate' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  day_streak INTEGER DEFAULT 1,
  longest_streak INTEGER DEFAULT 1,
  total_practice_days INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Topics Table (Speaking prompts across 3 levels)
CREATE TABLE IF NOT EXISTS public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  instructions TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Practice Sessions Table
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  topic_id UUID REFERENCES public.topics(id) ON DELETE SET NULL,
  topic_title TEXT NOT NULL,
  level TEXT NOT NULL,
  audio_url TEXT,
  audio_duration_seconds NUMERIC(5, 2) DEFAULT 0,
  transcript TEXT,
  status TEXT DEFAULT 'recorded' CHECK (status IN ('recorded', 'transcribing', 'assessing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Assessment Reports Table (Structured evaluation from OpenRouter)
CREATE TABLE IF NOT EXISTS public.assessment_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.practice_sessions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  overall_score NUMERIC(3, 1) NOT NULL,
  assessment_verdict TEXT NOT NULL,
  summary TEXT NOT NULL,
  corrected_transcript TEXT NOT NULL,
  grammar_score NUMERIC(3, 1) NOT NULL,
  vocabulary_score NUMERIC(3, 1) NOT NULL,
  fluency_score NUMERIC(3, 1) NOT NULL,
  repetition_score NUMERIC(3, 1) NOT NULL,
  filler_score NUMERIC(3, 1) NOT NULL,
  clarity_score NUMERIC(3, 1) NOT NULL,
  proficiency_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  targeted_corrections JSONB NOT NULL DEFAULT '[]'::jsonb,
  filler_distribution JSONB NOT NULL DEFAULT '[]'::jsonb,
  pedagogical_tip TEXT,
  suggested_model_answer TEXT NOT NULL,
  speaking_dynamics JSONB NOT NULL DEFAULT '{}'::jsonb,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  next_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  focus_goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw_openrouter_response JSONB,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Daily Practice Activity (Heatmap tracker)
CREATE TABLE IF NOT EXISTS public.practice_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  activity_date DATE NOT NULL,
  recording_count INTEGER DEFAULT 1,
  UNIQUE(user_id, activity_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_user_id ON public.practice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_created_at ON public.practice_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_user_id ON public.assessment_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_reports_session_id ON public.assessment_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_activity_user_date ON public.practice_activity(user_id, activity_date);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Profiles
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Topics (readable by everyone authenticated or public)
CREATE POLICY "Allow public read access to topics" ON public.topics
  FOR SELECT USING (true);

-- Practice Sessions
CREATE POLICY "Users can read own practice sessions" ON public.practice_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own practice sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own practice sessions" ON public.practice_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Assessment Reports
CREATE POLICY "Users can read own assessment reports" ON public.assessment_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessment reports" ON public.assessment_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Practice Activity
CREATE POLICY "Users can read own activity" ON public.practice_activity
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity" ON public.practice_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own activity" ON public.practice_activity
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger for new user signup -> auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Supabase Storage bucket for voice recordings
INSERT INTO storage.buckets (id, name, public)
VALUES ('betalky-recordings', 'betalky-recordings', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can upload their own recordings
CREATE POLICY "Users can upload their own recordings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'betalky-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage Policy: Anyone can view audio recordings
CREATE POLICY "Anyone can view audio recordings" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'betalky-recordings');

-- Seed Default Topics
INSERT INTO public.topics (title, level, instructions, category) VALUES
-- Beginner
('Do you have a hobby? Describe it.', 'Beginner', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Lifestyle'),
('Describe the people in your family.', 'Beginner', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Personal'),
('Describe a shop you visit often.', 'Beginner', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Daily Life'),
('Describe your favourite place in your city.', 'Beginner', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Places'),
('What is your favorite meal and how is it prepared?', 'Beginner', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Food'),
('What did you do during your most memorable weekend?', 'Beginner', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Experiences'),

-- Intermediate
('How could your city become friendlier for pedestrians?', 'Intermediate', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Urban Living'),
('Should companies allow employees to work remotely forever?', 'Intermediate', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Workplace'),
('What is a skill you would like to master and why?', 'Intermediate', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Growth'),
('How has social media changed the way we form friendships?', 'Intermediate', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Technology'),
('Describe an unforgettable trip you took and what made it special.', 'Intermediate', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Travel'),
('What are the pros and cons of living in a big city versus a small town?', 'Intermediate', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Society'),

-- Advanced
('How will artificial intelligence reshape modern education and critical thinking?', 'Advanced', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Technology'),
('Evaluate whether economic growth should take precedence over environmental sustainability.', 'Advanced', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Environment'),
('Analyze the ethical implications of autonomous decision-making in healthcare.', 'Advanced', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Ethics'),
('Discuss whether globalization has led to cultural homogenization or cultural revival.', 'Advanced', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Culture'),
('How can leaders maintain team cohesion and innovation in distributed organizations?', 'Advanced', 'Speak for at least 40 words — roughly 20 seconds. Do not write anything down first. Just talk.', 'Leadership')
ON CONFLICT DO NOTHING;

