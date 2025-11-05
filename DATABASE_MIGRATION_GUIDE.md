# Database Migration Setup for Competitive Timer

## Prerequisites
- Supabase project set up
- Database access to the `profiles` table

## Migration Steps

### Option 1: Using Supabase Dashboard (Recommended)
1. Log in to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Open the file `supabase/migrations/add_competitive_score.sql`
4. Copy the SQL content and paste it into the SQL Editor
5. Click "Run" to execute the migration
6. Verify the column was added by checking the `profiles` table schema

### Option 2: Using Supabase CLI
If you have the Supabase CLI installed:

```bash
# Navigate to your project root
cd BibleReviewApp

# Apply the migration
supabase db push

# Or if using local development
supabase migration up
```

## Verification

After running the migration, verify it worked:

1. **Check the column exists:**
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'competitive_score';
```

Expected output:
- column_name: competitive_score
- data_type: integer
- column_default: 0

2. **Check the index was created:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profiles' 
AND indexname = 'idx_profiles_competitive_score';
```

3. **Test a query:**
```sql
SELECT id, username, competitive_score 
FROM profiles 
ORDER BY competitive_score DESC 
LIMIT 10;
```

This should return the top 10 users by competitive score (all will be 0 initially).

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove the index
DROP INDEX IF EXISTS idx_profiles_competitive_score;

-- Remove the column
ALTER TABLE profiles DROP COLUMN IF EXISTS competitive_score;
```

## Testing

After migration, test the feature:

1. Start the app
2. Navigate to Session Timers
3. Start the Competitive Timer (15-minute timer at the top)
4. Complete some verse reviews
5. Stop the timer or let it finish
6. Check the Competitive Leaderboard
7. Verify your score appears on the leaderboard (if it's in the top 50)

## Troubleshooting

### Issue: Column already exists
If you see an error about the column already existing, it means the migration was already run. You can safely ignore this error due to the `IF NOT EXISTS` clause.

### Issue: Permission denied
Make sure your database user has sufficient permissions to:
- ALTER tables
- CREATE indexes
- UPDATE records

### Issue: Scores not syncing
Check the browser/app console for errors. Common issues:
- Network connectivity
- API endpoint configuration
- Authentication issues

## Additional Notes

- The migration is idempotent (safe to run multiple times)
- Existing users will have `competitive_score = 0` by default
- The index improves leaderboard query performance
- Scores are synced automatically when a competitive timer session ends
