import { createClient, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleBook, Chapter, Rarity, UserSettings, AppUser, AppSession, CompetitiveScope } from '../types/index'
import Constants from 'expo-constants';
import { Alert } from 'react-native';

console.log('Expo Config:', Constants.expoConfig); // Debug log

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;
const LEADERBOARD_ENTRIES_LIMIT = 50;

const COMPETITIVE_SCORE_COLUMNS: Record<
  CompetitiveScope,
  { score: string; updated: string }
> = {
  full: { score: 'competitive_score', updated: 'comp_score_update' },
  ot: { score: 'competitive_score_ot', updated: 'comp_score_update_ot' },
  nt: { score: 'competitive_score_nt', updated: 'comp_score_update_nt' },
};

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`
    Missing Supabase configuration! Debug info:
    - Expo Config: ${JSON.stringify(Constants.expoConfig, null, 2)}
    - Loaded .env: ${JSON.stringify(process.env, null, 2)}
  `);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});

const toAppUser = (user: SupabaseUser): AppUser => ({
  id: user.id,
  email: user.email ?? '',
});

export const toAppSession = (session: SupabaseSession): AppSession => ({
  userId: session.user.id,
  accessToken: session.access_token,
  expiresAt: session.expires_at,
  issuedAt: session.expires_in ? Date.now() / 1000 : undefined, // Optional logic
});

export const SupabaseService = {
  //User Authentication
  auth: {
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if(error) throw new Error(error.message);
      return {
        user: toAppUser(data.user),
        session: toAppSession(data.session),
      };
    },

    signUp: async (email: string, password: string, username: string) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim().toLowerCase(), // This gets passed into raw_user_meta_data
          },
        },
      });

      if (authError) {
        console.log(authError.message);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Signup failed');
      }

      return {
        user: toAppUser(authData.user),
        session: authData.session ? toAppSession(authData.session) : null,
      };
    },

    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(error.message);
    },

    getSession: async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw new Error(error.message);
      return data.session ? toAppSession(data.session) : null;
    },

    resendVerificationEmail: async (email: string): Promise<void> => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      if (error) throw error;
    },

    resetPasswordForEmail: async (email: string, redirectTo: string): Promise<void> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo.trim(),
      });
      if (error) throw new Error(error.message);
    },

    updatePassword: async (newPassword: string): Promise<void> => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(error.message);
    },

    setSessionFromTokens: async (accessToken: string, refreshToken: string): Promise<void> => {
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) throw new Error(error.message);
    },

    exchangeCodeForSession: async (code: string): Promise<void> => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw new Error(error.message);
    },

    verifyRecoveryTokenHash: async (tokenHash: string): Promise<void> => {
      const { error } = await supabase.auth.verifyOtp({
        type: 'recovery',
        token_hash: tokenHash,
      });
      if (error) throw new Error(error.message);
    },

    onAuthStateChange: (
      callback: (event: string, session: AppSession | null) => void,
    ) => {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback(event, session ? toAppSession(session) : null);
      });
      return { unsubscribe: () => data.subscription.unsubscribe() };
    },

    deleteAccount: async (accessToken: string, userId: string) => {
      const res = await fetch('https://uohnbyejhxxypjvbauks.supabase.co/functions/v1/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account.');
      }

      return data;
    },

    init: async (): Promise<{
      session: AppSession | null;
      user: AppUser | null;
      profile: { username: string } | null;
    }> => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw new Error(error.message);

      let profile = null;

      if (session?.user) {
        const { data, error: profileError } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (profileError) throw new Error(profileError.message);

        profile = data;
      }

      return {
        session: session ? toAppSession(session) : null,
        user: session?.user ? toAppUser(session.user) : null,
        profile,
      };
    }
  },

  usernames: {
    checkAvailability: async (username: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username',username.toLowerCase())
        .maybeSingle();

      return {
        available: !data,
        error: error?.message
      };
    },

    updateUsername: async (userId: string, newUsername: string) => {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername.toLowerCase() })
        .eq('id', userId);

      if (error) throw new Error(error.message);
    }
  },

  score: {
    getOverallScoreFromServer: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('overall_score')
        .eq('id', userId)
        .single()

        if (error) throw new Error(error.message);

      return {
          overallScore: data?.overall_score ?? 0,
      };
    },
    updateOverallScoreOnServer: async (userId: string, overallScore: number) => {
      const { error } = await supabase
        .from('profiles')
        .update({overall_score: overallScore})
        .eq('id', userId)

        if (error) throw error;
    },
    incrementUserScoreRpc: async (userId: string, points: number) => {
      const { error } = await supabase.rpc('increment_user_score', {
        user_id: userId,
        points,
      });

      if (error) throw error;
    },
    fetchTopScores: async (limit = LEADERBOARD_ENTRIES_LIMIT) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, overall_score')
        .order('overall_score', { ascending: false })
        .order('last_score_update', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    
    getCompetitiveScoreFromServer: async (userId: string, scope: CompetitiveScope = 'full') => {
      const columns = COMPETITIVE_SCORE_COLUMNS[scope];
      const { data, error } = await supabase
        .from('profiles')
        .select(`${columns.score}, ${columns.updated}`)
        .eq('id', userId)
        .single();

      if (error) throw new Error(error.message);

      return {
        competitiveScore: (data as Record<string, number | null>)?.[columns.score] ?? 0,
        compScoreUpdate: (data as Record<string, string | null>)?.[columns.updated] ?? null,
      };
    },

    updateCompetitiveScoreOnServer: async (
      userId: string,
      competitiveScore: number,
      scope: CompetitiveScope = 'full',
    ) => {
      const columns = COMPETITIVE_SCORE_COLUMNS[scope];
      const { error } = await supabase
        .from('profiles')
        .update({
          [columns.score]: competitiveScore,
          [columns.updated]: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;
    },

    fetchTopCompetitiveScores: async (scope: CompetitiveScope = 'full', limit = LEADERBOARD_ENTRIES_LIMIT) => {
      const columns = COMPETITIVE_SCORE_COLUMNS[scope];
      const { data, error } = await supabase
        .from('profiles')
        .select(`id, username, ${columns.score}`)
        .order(columns.score, { ascending: false })
        .order(columns.updated, { ascending: true })
        .limit(limit);

      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        username: row.username,
        competitive_score: (row as Record<string, number>)[columns.score] ?? 0,
      }));
    },

  },

  bibleBooks: {
    fetchAll: async (userId: string): Promise<BibleBook[]> => {
      const { data, error } = await supabase
        .from('user_bible_books')
        .select('*')
        .eq('user_id', userId);

        if(error) throw error;
        return data;
    },

    toggleEnabled: async (userId: string, bookName: string): Promise<BibleBook> => {
      // First get current state
      const { data: current } = await supabase
        .from('user_bible_books')
        .select('enabled')
        .eq('user_id', userId)
        .eq('book_name', bookName)
        .single();

      const newEnabled = !current?.enabled;

      //Then toggle
      const { data, error } = await supabase
        .from('user_bible_books')
        .upsert({
          user_id: userId,
          book_name: bookName,
          enabled: newEnabled,
          updated_at: new Date().toString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateChapterRarity: async (
      userId: string,
      bookName: string,
      chapterNum: number,
      rarity: Rarity
    ): Promise<Chapter> => {
      const { data, error } = await supabase
        .from('user_chapter_rarities')
        .upsert({
          user_id: userId,
          book_name: bookName,
          chapter: chapterNum,
          rarity,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

        if (error) throw error;
        return data;
    },

  },

  settings: {
    getSettings: async (userId: string) => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

        if(error) throw error;
        return data;
    },

    updateSettings: async (userId: string, settings: UserSettings) => {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
  }
};

export type UsernameAvailability = {
  available: boolean;
  error?: string;
};

export default supabase;

  
  

