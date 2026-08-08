import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { AuthKeyboardView } from '@/components/AuthKeyboardView';

export default function SignInScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const { user, isLoading, signIn } = useAuth();
  const { theme } = useThemeContext();
  const { alert } = useAlert();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  const handleSignIn = async () => {
    if (!email || !password) {
      alert('Error', 'Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      alert('Error', 'Failed to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || user) {
    return <AppLoadingScreen message="Opening your study…" />;
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <AuthKeyboardView>
        <Card style={styles.card}>
          <AppText variant="title" style={styles.title}>
            Welcome Back
          </AppText>
          <TextField
            label="Email"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => router.push('/forgot-password')}>
            <AppText variant="link" style={styles.forgotLink}>
              Forgot password?
            </AppText>
          </TouchableOpacity>
          {submitting ? (
            <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
          ) : (
            <View>
              <Button label="Sign In" onPress={handleSignIn} fullWidth />
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <AppText variant="muted" style={styles.linkText}>
                  Don't have an account?{' '}
                  <AppText variant="link" style={styles.linkHighlight}>
                    Sign up
                  </AppText>
                </AppText>
              </TouchableOpacity>
            </View>
          )}
        </Card>
      </AuthKeyboardView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 8,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 20,
  },
  linkText: {
    textAlign: 'center',
    marginTop: 16,
  },
  linkHighlight: {
    fontWeight: '700',
  },
});
