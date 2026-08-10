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
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AppLoadingScreen } from '@/components/AppLoadingScreen';
import { AuthKeyboardView } from '@/components/AuthKeyboardView';
import { validateEmail } from '@/utils/validateEmail';

export default function SignInScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const { user, isLoading, signIn } = useAuth();
  const { theme } = useThemeContext();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/(tabs)');
    }
  }, [user, isLoading]);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (formError) setFormError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
    if (formError) setFormError('');
  };

  const handleSignIn = async () => {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = password ? '' : 'Password is required.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setFormError('');

    if (nextEmailError || nextPasswordError) return;

    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tabs)');
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to sign in. Please try again.',
      );
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
            onChangeText={handleEmailChange}
            autoCapitalize="none"
            keyboardType="email-address"
            error={emailError}
          />
          <TextField
            label="Password"
            placeholder="Password"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoCapitalize="none"
            error={passwordError}
          />
          {formError ? (
            <AppText color={theme.danger} style={styles.formError}>
              {formError}
            </AppText>
          ) : null}
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
  formError: {
    marginTop: 4,
    marginBottom: 4,
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
