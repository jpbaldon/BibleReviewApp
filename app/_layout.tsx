import { Stack } from 'expo-router';
import { TimerProvider } from '../context/TimerContext';
import { ConfettiProvider } from '../context/ConfettiContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../context/AuthContext';
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
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <AppLoadingScreen message="Signing you in…" />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <SettingsProvider userId={user?.id}>
          {!user ? (
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
  const { isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = ['signin', 'signup', 'verifyemail'].includes(segments[0]);

    if (!user && !inAuthGroup) {
      router.replace('/signin');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isLoading, user, segments]);

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
      </Stack>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
    </NavThemeProvider>
  );
}
