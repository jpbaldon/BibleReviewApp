import React, { useState } from 'react';
import {
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
import { AuthKeyboardView } from '@/components/AuthKeyboardView';
import {
  PASSWORD_REQUIREMENTS_HINT,
  validatePassword,
} from '@/utils/validatePassword';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmError, setConfirmError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const { updatePassword, clearPasswordRecovery } = useAuth();
  const { theme } = useThemeContext();
  const { alert } = useAlert();

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
    if (confirmError && text === confirmPassword) setConfirmError('');
    if (formError) setFormError('');
  };

  const handleConfirmChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmError) setConfirmError('');
    if (formError) setFormError('');
  };

  const handleSubmit = async () => {
    const nextPasswordError = validatePassword(password);
    const nextConfirmError = !confirmPassword
      ? 'Please confirm your password.'
      : password !== confirmPassword
        ? 'Passwords do not match.'
        : '';

    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    setFormError('');

    if (nextPasswordError || nextConfirmError) return;

    setSubmitting(true);
    try {
      await updatePassword(password);
      // Keep the recovery lock until OK so the auth tree doesn't remount to
      // Home underneath this alert (which previously conflicted with "sign in").
      alert('Success', 'Your password has been updated.', [
        {
          text: 'OK',
          onPress: () => {
            clearPasswordRecovery();
            router.replace('/(tabs)');
          },
        },
      ]);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Failed to update password. Please try again.',
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
            Choose a New Password
          </AppText>
          <AppText variant="muted" style={styles.message}>
            Enter a new password for your account.
          </AppText>
          <TextField
            label="New Password"
            placeholder="New password"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoCapitalize="none"
            hint={PASSWORD_REQUIREMENTS_HINT}
            error={passwordError}
          />
          <TextField
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={handleConfirmChange}
            secureTextEntry
            autoCapitalize="none"
            error={confirmError}
          />
          {formError ? (
            <AppText color={theme.danger} style={styles.formError}>
              {formError}
            </AppText>
          ) : null}
          {submitting ? (
            <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
          ) : (
            <Button label="Update Password" onPress={handleSubmit} fullWidth />
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
});
