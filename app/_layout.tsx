import { Stack } from 'expo-router';
import { TimerProvider } from '../context/TimerContext';
import { ConfettiProvider } from '../context/ConfettiContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { AuthProvider, useAuth, isPasswordRecoveryPending } from '../context/AuthContext';
import { ScoreProvider } from '../context/ScoreContext';
import { BibleBooksProvider } from '../context/BibleBooksContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';
import { useSegments, useRouter } from 'expo-router';
import { ServicesProvider } from '../context/ServicesContext';
import { BackendProvider } from '../context/BackendContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeLoader } from '../context/ThemeLoader';
import { SettingsProvider } from '../context/SettingsContext';
import { AppLoadingScreen } from '../components/AppLoadingScreen';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return <AppLoadingScreen message="Preparing…" />;
  }

  return (
    <SafeAreaProvider>
      <BackendProvider>
        <AuthProvider>
          <ConfettiProvider>
            <InnerApp />
          </ConfettiProvider>
        </AuthProvider>
      </BackendProvider>
    </SafeAreaProvider>
  );
}

function InnerApp() {
  const { isLoading, user, isPasswordRecovery } = useAuth();
  const recovering = isPasswordRecovery || isPasswordRecoveryPending();

  if (isLoading) {
    return <AppLoadingScreen message="Signing you in…" />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider userId={recovering ? undefined : user?.id}>
          {/* During password recovery we have a session, but must not mount
              BibleBooks/SQLite (or other logged-in providers) yet. */}
          {!user || recovering ? (
            <LayoutContent />
          ) : (
            <ServicesProvider>
              <TimerProvider>
                <BibleBooksProvider>
                  <ScoreProvider>
                    <ThemeLoader userId={user.id} />
                    <LayoutContent />
                  </ScoreProvider>
                </BibleBooksProvider>
              </TimerProvider>
            </ServicesProvider>
          )}
        </SettingsProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function LayoutContent() {
  const { colorScheme, theme } = useThemeContext();
  const { isLoading, user, isPasswordRecovery } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const segment = segments[0];
    const publicAuthScreens = ['signin', 'signup', 'verifyemail', 'forgot-password'];
    const isResetPassword = segment === 'reset-password';
    const recovering = isPasswordRecovery || isPasswordRecoveryPending();

    if (recovering) {
      if (!isResetPassword) {
        router.replace('/reset-password');
      }
      return;
    }

    // Finished (or skipped) recovery while still on the reset screen.
    if (isResetPassword) {
      router.replace(user ? '/(tabs)' : '/signin');
      return;
    }

    if (!user && !publicAuthScreens.includes(segment)) {
      router.replace('/signin');
    } else if (user && publicAuthScreens.includes(segment)) {
      router.replace('/(tabs)');
    }
  }, [isLoading, user, segments, isPasswordRecovery]);

  if (isLoading) {
    return <AppLoadingScreen />;
  }

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
          headerTitleAlign: 'center',
          headerTransparent: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ title: 'Sign In' }} />
        <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
        <Stack.Screen name="verifyemail" options={{ title: 'Verify Email' }} />
        <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
        <Stack.Screen name="reset-password" options={{ title: 'Reset Password', headerBackVisible: false }} />
      </Stack>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
    </NavThemeProvider>
  );
}
