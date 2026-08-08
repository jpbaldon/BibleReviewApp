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

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const { updatePassword, clearPasswordRecovery } = useAuth();
  const { theme } = useThemeContext();
  const { alert } = useAlert();

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      alert('Error', 'Please fill in both password fields.');
      return;
    }
    if (password.length < 6) {
      alert('Error', 'Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      alert('Error', 'Passwords do not match.');
      return;
    }

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
      alert(
        'Error',
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
            placeholder="New password (min 6 chars)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <TextField
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
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
  loader: {
    marginVertical: 20,
  },
});
