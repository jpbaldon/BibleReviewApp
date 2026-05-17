-- =============================================================================
-- Migration: Add competitive score columns to profiles
-- Created: 2024-06-01
-- Description: Adds competitive_score and comp_score_update to the profiles
--              table for the competitive leaderboard feature.
--
-- Supersedes: supabase/migrations/add_competitive_score.sql (manual, untracked)
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS competitive_score   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comp_score_update   TIMESTAMPTZ;

-- Index for efficient leaderboard queries (score DESC, then earliest update wins)
CREATE INDEX IF NOT EXISTS idx_profiles_competitive_score
  ON public.profiles(competitive_score DESC, comp_score_update ASC);

-- Back-fill any existing rows
UPDATE public.profiles
SET competitive_score = 0
WHERE competitive_score IS NULL;
