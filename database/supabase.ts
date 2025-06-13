import { createClient, User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleBook, Chapter, Rarity, UserSettings, AppUser, AppSession } from '../types/index'
import Constants from 'expo-constants';

console.log('Expo Config:', Constants.expoConfig); // Debug log

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseKey = Constants.expoConfig?.extra?.supabaseKey;
const LEADERBOARD_ENTRIES_LIMIT = 50;

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
      });

      if (authError) throw new Error(authError.message);
      if (!authData.user) throw new Error('Signup failed');

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: username.toLowerCase()
        });
      
      if (profileError) {
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(profileError.message);
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
        .limit(limit);

      if (error) throw error;
      return data;
    }

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

      //Then toggle
      const { data, error } = await supabase
        .from('user_bible_books')
        .update({enabled: !current?.enabled})
        .eq('user_id', userId)
        .eq('book_name', bookName)
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

  
  

