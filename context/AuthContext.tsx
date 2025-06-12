import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/auth-js';
import supabase from '../supabaseClient';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Initially loading
  const [error, setError] = useState<string | null>(null);
  const [isSessionFetched, setIsSessionFetched] = useState(false);

  const fetchSession = async () => {
    //console.log('Fetching session...');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      //console.log('Session data:', session); // Log session data
      if (error) {
      //  console.error('Error fetching session:', error.message); // Log any error
        setError(error.message);
      } else if (session?.user) {
      //  console.log('User logged in:', session.user);
        setUser(session.user); // Update user state if logged in
      } else {
      //  console.log('No session found');
      }
    } catch (error) {
    //  console.error('Error fetching session:', error);
    } finally {
      setIsSessionFetched(true); // Mark session fetching as complete
      setLoading(false); // Stop loading when session is fetched
    }

    // Subscribe to auth state changes to handle session updates
    supabase.auth.onAuthStateChange((_event, session) => {
    //  console.log('Auth state changed:', session);
      setUser(session?.user || null); // Update user state when auth state changes
    });
  };

  useEffect(() => {
    fetchSession();
  }, []); // Run only once on mount

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err) {
      console.error('Sign-in error:', err);
      throw new Error('Failed to sign in');
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } catch (err) {
      console.error('Sign-up error:', err);
      throw new Error('Failed to sign up');
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null); // Ensure user is cleared after sign out
    } catch (err) {
      console.error('Sign-out error:', err);
      throw new Error('Failed to sign out');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut }}>
      {isSessionFetched ? children : null}
    </AuthContext.Provider>
  );
};

// Custom hook to access AuthContext values
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};