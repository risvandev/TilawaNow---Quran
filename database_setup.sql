-- QURAN APP DATABASE SETUP
-- RUN THIS IN YOUR SUPABASE SQL EDITOR

-- 1. PROFILES (USER STATS)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  total_ayahs_read INTEGER DEFAULT 0,
  unique_ayahs_read INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  last_active_date TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_ayah TEXT,
  frequent_topics JSONB DEFAULT '[]'::jsonb,
  ai_knowledge_level TEXT DEFAULT 'Beginner'
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'profiles') THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;


-- 2. BOOKMARKS
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL,
  verse_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own bookmarks' AND tablename = 'bookmarks') THEN
    CREATE POLICY "Users can manage own bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 3. READING HISTORY
CREATE TABLE IF NOT EXISTS public.reading_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL,
  verse_key TEXT,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surah_id)
);

ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own reading history' AND tablename = 'reading_history') THEN
    CREATE POLICY "Users can manage own reading history" ON public.reading_history FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 4. DAILY ACTIVITY (FOR CHARTS)
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  ayahs_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own daily activity' AND tablename = 'daily_activity') THEN
    CREATE POLICY "Users can manage own daily activity" ON public.daily_activity FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 5. MARKS (AYAH/SURAH COMPLETION)
CREATE TABLE IF NOT EXISTS public.marks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL,
  ayah_id INTEGER,
  type TEXT CHECK (type IN ('ayah', 'surah')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own marks' AND tablename = 'marks') THEN
    CREATE POLICY "Users can manage own marks" ON public.marks FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 6. VERSES READ (TRACKING UNIQUE AYAHS)
CREATE TABLE IF NOT EXISTS public.verses_read (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  verse_key TEXT NOT NULL,
  read_count INTEGER DEFAULT 1,
  difficulty_score INTEGER DEFAULT 0,
  struggle_count INTEGER DEFAULT 0,
  UNIQUE(user_id, verse_key)
);

ALTER TABLE public.verses_read ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own verses read' AND tablename = 'verses_read') THEN
    CREATE POLICY "Users can manage own verses read" ON public.verses_read FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 7. READING SESSIONS
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration INTEGER DEFAULT 0
);

ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own reading sessions' AND tablename = 'reading_sessions') THEN
    CREATE POLICY "Users can manage own reading sessions" ON public.reading_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 8. READING ACTIVITY (DETAILED SIGNALS)
CREATE TABLE IF NOT EXISTS public.reading_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  session_id UUID REFERENCES public.reading_sessions ON DELETE CASCADE NOT NULL,
  surah_id INTEGER NOT NULL,
  ayah_id INTEGER NOT NULL,
  visible_duration INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  status TEXT,
  UNIQUE(session_id, surah_id, ayah_id)
);

ALTER TABLE public.reading_activity ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own reading activity' AND tablename = 'reading_activity') THEN
    CREATE POLICY "Users can manage own reading activity" ON public.reading_activity FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 9. USER READING PROFILE (FOR RESUME FEATURE)
CREATE TABLE IF NOT EXISTS public.user_reading_profile (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  last_read_surah INTEGER NOT NULL,
  last_read_ayah INTEGER NOT NULL,
  last_read_timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_reading_profile ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own reading profile' AND tablename = 'user_reading_profile') THEN
    CREATE POLICY "Users can manage own reading profile" ON public.user_reading_profile FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;


-- 10. KHATMAH PROGRESS
CREATE TABLE IF NOT EXISTS public.khatmah_progress (
  user_id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  surah_id INTEGER NOT NULL,
  verse_key TEXT NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.khatmah_progress ENABLE ROW LEVEL SECURITY;
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can manage own khatmah progress' AND tablename = 'khatmah_progress') THEN
    CREATE POLICY "Users can manage own khatmah progress" ON public.khatmah_progress FOR ALL USING (auth.uid() = user_id);
  END IF;
END $$;

-- 11. AUTOMATIC PROFILE CREATION ON SIGNUP
-- This trigger creates a profile record automatically when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
