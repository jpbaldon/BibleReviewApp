-- =============================================================================
-- Migration: OT/NT competitive score columns on profiles
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS competitive_score_ot INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS competitive_score_nt INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comp_score_update_ot TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comp_score_update_nt TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_profiles_competitive_score_ot
  ON public.profiles(competitive_score_ot DESC, comp_score_update_ot ASC);

CREATE INDEX IF NOT EXISTS idx_profiles_competitive_score_nt
  ON public.profiles(competitive_score_nt DESC, comp_score_update_nt ASC);

UPDATE public.profiles
SET competitive_score_ot = 0
WHERE competitive_score_ot IS NULL;

UPDATE public.profiles
SET competitive_score_nt = 0
WHERE competitive_score_nt IS NULL;
