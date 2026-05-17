-- =============================================================================
-- Migration: Create competitive_scores table
-- Created: 2024-06-01
-- Description: Stores individual session scores from the 5-minute competitive
--              timer. Each completed session produces one row.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.competitive_scores (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score        INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for leaderboard and per-user queries
CREATE INDEX IF NOT EXISTS idx_competitive_scores_user_id
  ON public.competitive_scores(user_id);

CREATE INDEX IF NOT EXISTS idx_competitive_scores_score
  ON public.competitive_scores(score DESC);

CREATE INDEX IF NOT EXISTS idx_competitive_scores_completed_at
  ON public.competitive_scores(completed_at);

-- Row Level Security
ALTER TABLE public.competitive_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view competitive scores"
  ON public.competitive_scores FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own competitive scores"
  ON public.competitive_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.competitive_scores IS
  'Individual session scores from 5-minute competitive timer runs.';
