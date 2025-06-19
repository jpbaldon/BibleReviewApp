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

type AuthContextType = {
  user: AppUser | null;
  session: AppSession | null;
  profile: { username: string } | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
  updateUsername: (newUsername: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const { session, user, profile } = await backend.auth.init();
        setSession(session);
        setUser(user);
        setProfile(profile);
        if(user)
          await AsyncStorage.setItem('currentUserId', user.id);

      } catch (err: any) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [backend]);

  // ---- Auth Actions ----

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, session } = await backend.auth.signIn(email, password);
      setUser(user);
      setSession(session);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { user, session } = await backend.auth.signUp(email, password, username);

      console.log('Made it');
      if(!session) { //if the user has not been automatically logged in, then presumably the verifciation requirement is enabled on supababase dashboard
          router.replace({
          pathname: '/verifyemail',
          params: { email }
        });
      } else {  //otherwise, they have automatically been logged in; direct user to the home screen
        setUser(user);
        setSession(session);
        router.replace({ pathname: '/(tabs)'});
      }
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      //setIsLoading(false);
    }
  };

  const signOut = async () => {
    //setIsLoading(true);
    setError(null);
    try {
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
    if(!user) return;
    await backend.usernames.updateUsername(user.id, newUsername);
    setProfile({ username: newUsername });
  };

  const resendVerificationEmail = async (email: string) => {
    await backend.auth.resendVerificationEmail(email);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        error,
        signIn,
        signUp,
        signOut,
        checkUsernameAvailability,
        updateUsername,
        resendVerificationEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};