import React, { useState } from 'react';
import { StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { useAlert } from '../context/AlertContext';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function VerifyEmailScreen() {
  const [loading, setLoading] = useState<boolean>(false);
  const [cooldown, setCoolDown] = useState<number>(0);

  const { resendVerificationEmail } = useAuth();
  const { theme } = useThemeContext();
  const { alert } = useAlert();
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const handleResendEmail = async () => {
    if (cooldown > 0) return;

    setLoading(true);
    try {
      await resendVerificationEmail(email);

      alert('Success', 'Verification email resent successfully!');
      setCoolDown(60);

      const interval = setInterval(() => {
        setCoolDown(prev => {
          if (prev <= 1) clearInterval(interval);
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to resend verification email',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.container} padded>
      <Card style={styles.card}>
        <MaterialIcons
          name="mark-email-read"
          size={72}
          color={theme.accent}
          style={styles.icon}
        />

        <AppText variant="title" style={styles.title}>
          Verify Your Email
        </AppText>

        <AppText variant="muted" style={styles.message}>
          We've sent a verification link to
        </AppText>
        <AppText variant="bodyBold" style={styles.email}>
          {email}
        </AppText>
        <AppText variant="muted" style={styles.message}>
          Please check your inbox and click the link to verify your account.
        </AppText>

        <AppText variant="caption" style={styles.note}>
          If you don't see the email, check your spam folder or click the resend button below.
        </AppText>

        <Button
          label="Go to Sign In"
          onPress={() => router.replace('/signin')}
          fullWidth
        />

        {loading ? (
          <ActivityIndicator color={theme.accent} style={styles.loader} />
        ) : (
          <Button
            label={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
            variant="secondary"
            onPress={handleResendEmail}
            disabled={loading || cooldown > 0}
            fullWidth
          />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
  },
  card: {
    paddingVertical: 12,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    textAlign: 'center',
    marginBottom: 12,
  },
  note: {
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  email: {
    textAlign: 'center',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
});
