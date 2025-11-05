-- Add competitive_score column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS competitive_score INTEGER DEFAULT 0;

-- Create an index for efficient leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_competitive_score 
ON profiles(competitive_score DESC);

-- Update existing users to have 0 as default competitive_score
UPDATE profiles 
SET competitive_score = 0 
WHERE competitive_score IS NULL;
