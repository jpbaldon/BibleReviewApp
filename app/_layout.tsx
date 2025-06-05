import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native';
import { AuthProvider } from '../context/AuthContext';
import { ScoreProvider } from '../context/ScoreContext';
import { BibleBooksProvider } from '../context/BibleBooksContext';
import { ThemeProvider, useThemeContext } from '../context/ThemeContext';

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
        <AuthProvider>
          <BibleBooksProvider>
            <ScoreProvider>
              <ThemeProvider>
                <LayoutContent/>
              </ThemeProvider>
            </ScoreProvider>
          </BibleBooksProvider>
        </AuthProvider>
  );
}

function LayoutContent() {
  const { colorScheme, theme } = useThemeContext();

  return (
    <NavThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
          headerTitleAlign: 'center'
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="signin" options={{ title: "Sign In" }} />
        <Stack.Screen name="signup" options={{ title: "Sign Up" }} />
        <Stack.Screen name="verifyemail" options={{ title: "Verify Email" }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </NavThemeProvider>
  );
}