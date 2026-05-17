-- =============================================================================
-- Migration: Enforce one competitive_scores row per user
-- Created: 2024-06-01
-- Description: Adds a unique index so each user has at most one entry in the
--              competitive_scores table (best-score tracking model).
--
-- Supersedes: COMPETITIVE_SCORE_UNIQUE.sql (manual, untracked)
-- =============================================================================

-- Drop any pre-existing constraint to make this idempotent
ALTER TABLE public.competitive_scores
  DROP CONSTRAINT IF EXISTS unique_user_competitive_score;

-- A unique index is slightly lighter than a constraint and still enforces
-- uniqueness while supporting efficient upserts.
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_competitive_score
  ON public.competitive_scores(user_id);
