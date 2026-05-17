-- =============================================================================
-- Migration: Initial Schema
-- Created: 2023-06-01
-- Description: Baseline schema for BibleReviewApp — reconstructed from
--              existing code. If applying to a fresh database, run this first.
--              If your database already has these tables, mark this migration
--              as applied with:
--                supabase migration repair --status applied 20230601000000
-- =============================================================================

-- -------------------------------------
-- profiles
-- Auto-populated via trigger on auth.users insert.
-- -------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username     TEXT UNIQUE NOT NULL,
  overall_score INTEGER NOT NULL DEFAULT 0,
  last_score_update TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- -------------------------------------
-- user_bible_books
-- Tracks which Bible books a user has enabled for review sessions.
-- -------------------------------------
CREATE TABLE IF NOT EXISTS public.user_bible_books (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_name  TEXT NOT NULL,
  enabled    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_name)
);

ALTER TABLE public.user_bible_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own bible books"
  ON public.user_bible_books FOR ALL
  USING (auth.uid() = user_id);

-- -------------------------------------
-- user_chapter_rarities
-- Stores the rarity classification for each chapter per user.
-- Rarity values: 'common' | 'uncommon' | 'rare' | 'ultraRare' | 'disabled'
-- -------------------------------------
CREATE TABLE IF NOT EXISTS public.user_chapter_rarities (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_name  TEXT NOT NULL,
  chapter    INTEGER NOT NULL,
  rarity     TEXT NOT NULL DEFAULT 'common',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, book_name, chapter)
);

ALTER TABLE public.user_chapter_rarities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chapter rarities"
  ON public.user_chapter_rarities FOR ALL
  USING (auth.uid() = user_id);

-- -------------------------------------
-- user_settings
-- One row per user for application preferences.
-- -------------------------------------
CREATE TABLE IF NOT EXISTS public.user_settings (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  "swapPressActions"  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_bible_books_user_id ON public.user_bible_books(user_id);
CREATE INDEX IF NOT EXISTS idx_user_chapter_rarities_user_id ON public.user_chapter_rarities(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_overall_score ON public.profiles(overall_score DESC, last_score_update ASC);
