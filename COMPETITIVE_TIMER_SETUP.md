# Competitive Timer Setup Instructions

## Database Migration Required

You need to create a new table in your Supabase database to store competitive timer scores.

### SQL Migration Script

Run this SQL in your Supabase SQL Editor:

```sql
-- Create competitive_scores table
CREATE TABLE IF NOT EXISTS competitive_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_competitive_scores_user_id ON competitive_scores(user_id);
CREATE INDEX idx_competitive_scores_score ON competitive_scores(score DESC);
CREATE INDEX idx_competitive_scores_completed_at ON competitive_scores(completed_at);

-- Enable Row Level Security
ALTER TABLE competitive_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all competitive scores (for leaderboard)
CREATE POLICY "Anyone can view competitive scores"
  ON competitive_scores
  FOR SELECT
  USING (true);

-- Policy: Users can only insert their own scores
CREATE POLICY "Users can insert their own competitive scores"
  ON competitive_scores
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users cannot update competitive scores (scores are immutable once submitted)
-- Policy: Users cannot delete competitive scores (scores are permanent)

COMMENT ON TABLE competitive_scores IS 'Stores scores from 5-minute competitive timer sessions';
```

## Features Implemented

### 1. **Competitive Timer**
   - Fixed 5-minute timer that cannot be edited or deleted
   - Displayed at the top of the Timers screen with special styling
   - Shows current session score while active
   - Automatically submits score to leaderboard when timer completes

### 2. **Score Tracking**
   - Separate scoring system for competitive sessions
   - Scores accumulate during the 5-minute session
   - All review activities (summaries, verses) contribute to the score
   - Score is automatically submitted to the database when timer finishes

### 3. **Competitive Leaderboard**
   - New dedicated screen showing top competitive scores
   - Displays rank, username, score, and completion date
   - Highlights current user's entries
   - Pull-to-refresh functionality
   - Accessible from Home screen and tab navigation

### 4. **API Integration**
   - `submitCompetitiveScore(userId, score)` - Submit a completed session score
   - `fetchCompetitiveTopScores(limit)` - Get top scores for leaderboard
   - `fetchUserBestCompetitiveScore(userId)` - Get user's personal best

## Usage

1. **Start a Competitive Session:**
   - Navigate to "Session Timers" from the Home screen
   - Press the play button on the Competitive Timer (15 min)
   - Answer questions on any review screen (Summaries or Verses)
   - Your score accumulates during the session

2. **Timer Completes:**
   - After 15 minutes, the timer stops automatically
   - Your final score is submitted to the competitive leaderboard
   - You receive a confirmation alert

3. **View Leaderboard:**
   - Navigate to "Competitive Leaderboard" from the Home screen
   - See your rank among other players
   - Your entries are highlighted in bold
   - Pull down to refresh the leaderboard

## Technical Details

### Files Modified:
- `context/TimerContext.tsx` - Added competitive timer logic
- `app/(tabs)/timers.tsx` - Updated UI to display competitive timer
- `database/supabase.ts` - Added competitive score database methods
- `hooks/createBackendServices.ts` - Exposed competitive score services
- `types/index.ts` - Added CompetitiveLeaderboardEntry type
- `components/ReviewScreenTemplate.tsx` - Added competitive score increment
- `app/(tabs)/index.tsx` - Added competitive leaderboard link

### Files Created:
- `app/(tabs)/competitiveLeaderboard.tsx` - New leaderboard screen
- `app/(tabs)/_layout.tsx` - Added competitive leaderboard tab

## Notes

- Competitive scores are **immutable** once submitted (cannot be edited or deleted)
- Each completed 5-minute session creates a new entry in the leaderboard
- Users can have multiple entries (one per completed session)
- Leaderboard shows top 50 scores by default (configurable)
- Scores are tied to user accounts and displayed with usernames
