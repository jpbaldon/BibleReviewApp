import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { useBackend } from '../context/BackendContext';
import { AppUser, AppSession } from '../types/index';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import {
  getPasswordResetRedirectUrl,
  isPasswordRecoveryUrl,
  parseAuthUrlParams,
} from '../utils/authRedirect';

/** Sync lock so routing doesn't send recovery users to Home before React state commits. */
let passwordRecoveryLock = false;

export function isPasswordRecoveryPending(): boolean {
  return passwordRecoveryLock;
}

type AuthContextType = {
  user: AppUser | null;
  session: AppSession | null;
  profile: { username: string } | null;
  isLoading: boolean;
  error: string | null;
  isPasswordRecovery: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateUsername: (newUsername: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  clearPasswordRecovery: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const backend = useBackend();
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<AppSession | null>(null);
  const [profile, setProfile] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const { session, user, profile } = await backend.auth.init();
        setSession(session);
        setUser(user);
        setProfile(profile);
        if (user) {
          await AsyncStorage.setItem('currentUserId', user.id);
        }
      } catch (err: any) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [backend]);

  const refreshAuthState = async () => {
    const next = await backend.auth.init();
    setSession(next.session);
    setUser(next.user);
    setProfile(next.profile);
    return next;
  };

  // Handle password-recovery / auth deep links from email (Expo Go or native).
  useEffect(() => {
    const handleAuthUrl = async (url: string | null) => {
      if (!url) return;

      // Ignore non-auth deep links.
      const looksLikeAuth =
        url.includes('access_token') ||
        url.includes('refresh_token') ||
        url.includes('token_hash') ||
        url.includes('type=recovery') ||
        url.includes('reset-password') ||
        url.includes('code=');
      if (!looksLikeAuth) return;

      try {
        const params = parseAuthUrlParams(url);
        // Any link aimed at reset-password is recovery — including after Supabase verify.
        const isRecovery = isPasswordRecoveryUrl(url, params);

        // Lock + navigate BEFORE establishing session so the auth guard can't
        // treat the new session as a normal login and send the user to Home.
        if (isRecovery) {
          passwordRecoveryLock = true;
          setIsPasswordRecovery(true);
          router.replace('/reset-password');
        }

        if (params.access_token && params.refresh_token) {
          await backend.auth.setSessionFromTokens(params.access_token, params.refresh_token);
        } else if (params.token_hash && (params.type === 'recovery' || isRecovery)) {
          await backend.auth.verifyRecoveryTokenHash(params.token_hash);
        } else if (params.code) {
          await backend.auth.exchangeCodeForSession(params.code);
        } else {
          if (isRecovery) {
            passwordRecoveryLock = false;
            setIsPasswordRecovery(false);
          }
          return;
        }

        await refreshAuthState();

        if (isRecovery) {
          router.replace('/reset-password');
        }
      } catch (err) {
        console.error('Failed to handle auth deep link:', err);
        passwordRecoveryLock = false;
        setIsPasswordRecovery(false);
      }
    };

    void Linking.getInitialURL().then(handleAuthUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthUrl(url);
    });
    return () => subscription.remove();
  }, [backend, router]);

  // Backup: if Supabase emits PASSWORD_RECOVERY / SIGNED_IN during recovery, stay on reset.
  useEffect(() => {
    const { unsubscribe } = backend.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        passwordRecoveryLock = true;
        setIsPasswordRecovery(true);
        setSession(nextSession);
        router.replace('/reset-password');
        return;
      }
      if (passwordRecoveryLock && event === 'SIGNED_IN') {
        setIsPasswordRecovery(true);
        setSession(nextSession);
        router.replace('/reset-password');
      }
    });
    return unsubscribe;
  }, [backend, router]);

  // ---- Auth Actions ----

  const signIn = async (email: string, password: string) => {
    setError(null);
    try {
      const { user, session } = await backend.auth.signIn(email, password);
      passwordRecoveryLock = false;
      setIsPasswordRecovery(false);
      setUser(user);
      setSession(session);
      if (user) {
        await AsyncStorage.setItem('currentUserId', user.id);
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setError(null);
    try {
      const { user, session } = await backend.auth.signUp(email, password, username);

      if (!session) {
        router.replace({
          pathname: '/verifyemail',
          params: { email },
        });
      } else {
        setUser(user);
        setSession(session);
        if (user) {
          await AsyncStorage.setItem('currentUserId', user.id);
        }
        router.replace({ pathname: '/(tabs)' });
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      await backend.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      passwordRecoveryLock = false;
      setIsPasswordRecovery(false);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!user || !session || !session.accessToken) return;
    setIsLoading(true);
    setError(null);

    try {
      await backend.auth.deleteAccount(session.accessToken, user.id);
      await backend.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    const result = await backend.usernames.checkAvailability(username);
    return result.available;
  };

  const updateUsername = async (newUsername: string) => {
    if (!user) return;
    await backend.usernames.updateUsername(user.id, newUsername);
    setProfile({ username: newUsername });
  };

  const resendVerificationEmail = async (email: string) => {
    await backend.auth.resendVerificationEmail(email);
  };

  const resetPasswordForEmail = async (email: string) => {
    const redirectTo = getPasswordResetRedirectUrl();
    await backend.auth.resetPasswordForEmail(email.trim().toLowerCase(), redirectTo);
  };

  const updatePassword = async (newPassword: string) => {
    await backend.auth.updatePassword(newPassword);
  };

  const clearPasswordRecovery = () => {
    passwordRecoveryLock = false;
    setIsPasswordRecovery(false);
  };

  return (
    <AuthContext
      value={{
        user,
        session,
        profile,
        isLoading,
        error,
        isPasswordRecovery,
        signIn,
        signUp,
        signOut,
        deleteAccount,
        checkUsernameAvailability,
        updateUsername,
        resendVerificationEmail,
        resetPasswordForEmail,
        updatePassword,
        clearPasswordRecovery,
      }}
    >
      {children}
    </AuthContext>
  );
};
