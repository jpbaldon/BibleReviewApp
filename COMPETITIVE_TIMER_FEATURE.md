# Competitive Timer Feature

## Overview
The Competitive Timer is a special 5-minute challenge timer that allows users to compete with others on a global leaderboard. Unlike regular session timers, the competitive timer:

- **Fixed Duration**: Always 15 minutes (900 seconds)
- **Cannot be Edited or Deleted**: It's a permanent fixture in the app
- **Exclusive Operation**: When running, it stops all other session timers (and vice versa)
- **Global Leaderboard**: Best scores are synced to the server and displayed on a dedicated leaderboard

## Features

### 1. Competitive Timer Display
- Located at the top of the Timers screen in a special highlighted section
- Styled with a gold accent color (#FFD700) to distinguish it from regular timers
- Shows:
  - Current remaining time
  - Personal best score
  - Play/Stop controls (cannot be edited or deleted)

### 2. Mutual Exclusivity
When the competitive timer starts:
- All active session timers are automatically stopped and reset
- Session timer scores are reset

When a session timer starts:
- The competitive timer is automatically stopped and reset
- Competitive score is reset

### 3. Score Tracking
During a competitive timer session:
- Scores increment based on correct answers in verse review
- Current competitive session score is displayed in gold
- Personal best is always visible
- When the timer ends or is stopped early:
  - If the score beats the previous best, it's saved locally and synced to the server
  - Confetti animation plays for new personal bests
  - Alert notifies the user of their achievement

### 4. Competitive Leaderboard
A dedicated leaderboard screen shows:
- Top players with their best competitive scores
- Trophy and medal icons for top 3 players
  - 🥇 1st Place: Gold medal (#FFD700)
  - 🥈 2nd Place: Silver medal (#C0C0C0)
  - 🥉 3rd Place: Bronze medal (#CD7F32)
- Star indicators for top performers
- Current user's position highlighted
- Larger text and enhanced styling for top 3
- Pull-to-refresh functionality

## Implementation Details

### Database Schema
A new column `competitive_score` was added to the `profiles` table:
```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS competitive_score INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_competitive_score 
ON profiles(competitive_score DESC);
```

### API Endpoints
New methods added to the ScoreService:
- `getCompetitiveScoreFromServer()`: Fetches user's best competitive score
- `updateCompetitiveScoreOnServer(score)`: Updates user's competitive score
- `fetchTopCompetitiveScores(limit?)`: Gets top competitive scores for leaderboard

### Context Updates
**TimerContext** now manages:
- `competitiveTimer`: The fixed 5-minute timer state
- `competitiveScore`: Current session score
- `incrementCompetitiveScore()`: Increments score during competitive sessions
- `startCompetitiveTimer()`: Starts the competitive timer (stops session timers)
- `stopCompetitiveTimer()`: Stops the competitive timer (saves if new best)

### Component Updates
1. **Timers Screen** (`timers.tsx`):
   - Displays competitive timer in a dedicated section at the top
   - Gold styling to distinguish from session timers
   - Shows personal best score

2. **Competitive Leaderboard** (`competitiveLeaderboard.tsx`):
   - New screen with enhanced styling
   - Medal/trophy icons based on rank
   - Larger text and special effects for top 3
   - Gold color scheme (#FFD700)

3. **Review Screen Template** (`ReviewScreenTemplate.tsx`):
   - Detects competitive timer state
   - Increments competitive score when competitive timer is active
   - Displays competitive timer info and score in gold

4. **Home Screen** (`index.tsx`):
   - Added link to Competitive Leaderboard with trophy emoji

## User Experience

### Starting a Competitive Session
1. Navigate to Session Timers
2. Press play on the Competitive Timer
3. Any active session timer will be stopped
4. Start reviewing verses - your score will accumulate
5. The competitive timer countdown is displayed in gold at the top of review screens

### Ending a Session
The competitive session ends when:
- The 5-minute timer runs out
- User manually stops the timer
- User starts a different session timer

If the score beats the previous best:
- Confetti animation plays
- New best is saved locally and synced to server
- Alert confirms the achievement

### Viewing Rankings
1. Navigate to "🏆 Competitive Leaderboard" from the home screen
2. View top players with their best scores
3. Top 3 players have special styling with medals
4. Your position is highlighted if you're on the leaderboard
5. Pull down to refresh rankings

## Code Files Modified/Created

### Created:
- `app/(tabs)/competitiveLeaderboard.tsx` - New leaderboard screen
- `supabase/migrations/add_competitive_score.sql` - Database migration

### Modified:
- `context/TimerContext.tsx` - Added competitive timer logic
- `app/(tabs)/timers.tsx` - Added competitive timer display
- `app/(tabs)/index.tsx` - Added leaderboard link
- `components/ReviewScreenTemplate.tsx` - Added competitive score tracking
- `types/index.ts` - Added competitive types
- `database/supabase.ts` - Added competitive score methods
- `hooks/createBackendServices.ts` - Added competitive score service wrappers

## Future Enhancements
Possible improvements for the competitive timer feature:
- Weekly/monthly leaderboard resets
- Multiple time duration options (10min, 15min, 30min)
- Achievements and badges for milestones
- Head-to-head challenges between users
- Real-time leaderboard updates during sessions
