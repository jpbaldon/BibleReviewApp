import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform, StatusBar } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ScoreProvider } from '../context/ScoreContext';
import { BibleBooksProvider } from '../context/BibleBooksContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';
import { useSegments, useRouter } from 'expo-router';
import { ServicesProvider } from '../context/ServicesContext';
import { BackendProvider } from '../context/BackendContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeLoader } from '../context/ThemeLoader';
import { SettingsProvider } from '../context/SettingsContext';

export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <BackendProvider>
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </BackendProvider>
    </SafeAreaProvider>
  );
}

function InnerApp() {
  const { isLoading, user } = useAuth();

  if (isLoading) return null; // or spinner

  if (!user) {
    return (
        <ThemeProvider>
          <LayoutContent />
        </ThemeProvider>
    );
  }

  return (
      <ServicesProvider>
        <BibleBooksProvider>
          <ScoreProvider>
            <ThemeProvider>
              <SettingsProvider userId={user.id}>
                <ThemeLoader userId={user.id} />
                <LayoutContent />
              </SettingsProvider>
            </ThemeProvider>
          </ScoreProvider>
        </BibleBooksProvider>
      </ServicesProvider>
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

  // Show a loading spinner until the loading is complete
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
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
        <Stack.Screen name="signin" options={{ title: "Sign In" }} />
        <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
        <Stack.Screen name="verifyemail" options={{ title: "Verify Email" }} />
      </Stack>
      <StatusBar barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
      backgroundColor={theme.background} />
    </NavThemeProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});