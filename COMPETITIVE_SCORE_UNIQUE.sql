-- Ensure only one entry per user in competitive_scores
ALTER TABLE competitive_scores DROP CONSTRAINT IF EXISTS unique_user_competitive_score;
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_competitive_score ON competitive_scores(user_id);

-- If you want to use a constraint instead of an index:
-- ALTER TABLE competitive_scores ADD CONSTRAINT unique_user_competitive_score UNIQUE (user_id);
