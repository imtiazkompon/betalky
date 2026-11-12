-- ========================================================
-- beTalky Vocabulary Learning Module Schema & Migrations
-- Run this in your Supabase SQL Editor
-- ========================================================

-- 1. Vocabulary Units Table
CREATE TABLE IF NOT EXISTS public.vocabulary_units (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  display_order INTEGER DEFAULT 1,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Vocabulary Words Table
CREATE TABLE IF NOT EXISTS public.vocabulary_words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  pronunciation TEXT,
  part_of_speech TEXT NOT NULL,
  english_definition TEXT NOT NULL,
  bengali_meaning TEXT NOT NULL,
  example_sentence TEXT NOT NULL,
  example_translation TEXT NOT NULL,
  synonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
  antonyms JSONB NOT NULL DEFAULT '[]'::jsonb,
  collocations JSONB NOT NULL DEFAULT '[]'::jsonb,
  level TEXT NOT NULL CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  unit_id TEXT REFERENCES public.vocabulary_units(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. User Vocabulary Progress & Notebook
CREATE TABLE IF NOT EXISTS public.user_vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word_id TEXT REFERENCES public.vocabulary_words(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'learning' CHECK (status IN ('unseen', 'learning', 'learned')),
  is_bookmarked BOOLEAN DEFAULT false,
  difficulty_status TEXT DEFAULT 'normal' CHECK (difficulty_status IN ('normal', 'difficult')),
  user_sentence TEXT,
  review_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  interval_days INTEGER DEFAULT 1,
  learned_at TIMESTAMPTZ,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, word_id)
);

-- 4. Learning Sessions
CREATE TABLE IF NOT EXISTS public.learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  level TEXT NOT NULL,
  unit_id TEXT REFERENCES public.vocabulary_units(id) ON DELETE SET NULL,
  session_status TEXT DEFAULT 'in_progress' CHECK (session_status IN ('in_progress', 'completed')),
  words_studied JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_count INTEGER DEFAULT 0,
  incorrect_count INTEGER DEFAULT 0,
  accuracy INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 5. Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  word_id TEXT REFERENCES public.vocabulary_words(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.learning_sessions(id) ON DELETE SET NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('meaning', 'fill_in_blank', 'matching', 'sentence_builder')),
  selected_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for fast querying
CREATE INDEX IF NOT EXISTS idx_vocabulary_words_level ON public.vocabulary_words(level);
CREATE INDEX IF NOT EXISTS idx_vocabulary_words_unit ON public.vocabulary_words(unit_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_user ON public.user_vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_vocab_next_review ON public.user_vocabulary(user_id, next_review_at);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user ON public.learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.vocabulary_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vocabulary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read of vocabulary units" ON public.vocabulary_units
  FOR SELECT USING (true);

CREATE POLICY "Allow public read of vocabulary words" ON public.vocabulary_words
  FOR SELECT USING (true);

CREATE POLICY "Users can view own vocabulary progress" ON public.user_vocabulary
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vocabulary progress" ON public.user_vocabulary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vocabulary progress" ON public.user_vocabulary
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vocabulary progress" ON public.user_vocabulary
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own learning sessions" ON public.learning_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own learning sessions" ON public.learning_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own learning sessions" ON public.learning_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

