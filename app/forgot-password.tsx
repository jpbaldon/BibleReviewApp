import React, { useState } from 'react';
import {
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
import { AuthKeyboardView } from '@/components/AuthKeyboardView';
import { validateEmail } from '@/utils/validateEmail';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sent, setSent] = useState<boolean>(false);

  const router = useRouter();
  const { resetPasswordForEmail } = useAuth();
  const { theme } = useThemeContext();

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (formError) setFormError('');
  };

  const handleSubmit = async () => {
    const nextEmailError = validateEmail(email);
    if (nextEmailError) {
      setEmailError(nextEmailError);
      setFormError('');
      return;
    }

    setEmailError('');
    setFormError('');
    setSubmitting(true);
    try {
      await resetPasswordForEmail(email.trim());
      setSent(true);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to send reset email. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <AuthKeyboardView>
        <Card style={styles.card}>
          <AppText variant="title" style={styles.title}>
            Forgot Password
          </AppText>

          {sent ? (
            <>
              <AppText variant="muted" style={styles.message}>
                If an account exists for that email, we sent a password reset link.
                Open it on this device to choose a new password.
              </AppText>
              <Button
                label="Back to Sign In"
                onPress={() => router.replace('/signin')}
                fullWidth
              />
            </>
          ) : (
            <>
              <AppText variant="muted" style={styles.message}>
                Enter the email for your account and we'll send you a link to reset your password.
              </AppText>
              <TextField
                label="Email"
                placeholder="Email"
                value={email}
                onChangeText={handleEmailChange}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                error={emailError}
              />
              {formError ? (
                <AppText color={theme.danger} style={styles.formError}>
                  {formError}
                </AppText>
              ) : null}
              {submitting ? (
                <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
              ) : (
                <Button label="Send Reset Link" onPress={handleSubmit} fullWidth />
              )}
              <TouchableOpacity onPress={() => router.back()}>
                <AppText variant="muted" style={styles.linkText}>
                  <AppText variant="link" style={styles.linkHighlight}>
                    Back to Sign In
                  </AppText>
                </AppText>
              </TouchableOpacity>
            </>
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
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    marginBottom: 20,
  },
  formError: {
    marginBottom: 8,
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
