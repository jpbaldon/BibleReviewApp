import React, { useState } from 'react';
import {
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
import { AuthKeyboardView } from '@/components/AuthKeyboardView';
import { validateEmail } from '@/utils/validateEmail';

export default function SignUpScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmError, setConfirmError] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const { signUp, checkUsernameAvailability } = useAuth();
  const { theme } = useThemeContext();
  const { alert } = useAlert();

  const validateUsername = (text: string) => {
    if (text.length > 0 && text.length < 3) return 'Username must be at least 3 characters';
    if (/\s/.test(text)) return 'Username cannot contain spaces';
    if (!/^[a-zA-Z0-9_]+$/.test(text)) return 'Only letters, numbers and underscores allowed';
    return '';
  };

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (formError) setFormError('');
  };

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

  const handleUsernameChange = async (text: string) => {
    setUsername(text);
    if (formError) setFormError('');
    const error = validateUsername(text);
    setUsernameError(error);

    if (!error && text.length >= 3) {
      setCheckingUsername(true);
      const available = await checkUsernameAvailability(text);
      setUsernameError(available ? '' : 'Username is taken');
      setCheckingUsername(false);
    }
  };

  const handleSignUp = async () => {
    const nextEmailError = validateEmail(email);
    const nextPasswordError = !password
      ? 'Password is required.'
      : password.length < 6
        ? 'Password should be at least 6 characters.'
        : '';
    const nextConfirmError = !confirmPassword
      ? 'Please confirm your password.'
      : password !== confirmPassword
        ? 'Passwords do not match.'
        : '';
    const nextUsernameError = !username.trim()
      ? 'Username is required.'
      : usernameError || validateUsername(username);

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmError(nextConfirmError);
    setUsernameError(nextUsernameError);
    setFormError('');

    if (nextEmailError || nextPasswordError || nextConfirmError || nextUsernameError) return;

    setSubmitting(true);
    try {
      const available = await checkUsernameAvailability(username.trim().toLowerCase());
      if (!available) {
        setUsernameError('Username is no longer available');
        return;
      }

      await signUp(email.trim(), password, username.trim().toLowerCase());
      alert('Success', 'Account created successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      setFormError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !usernameError && !!username && !submitting;

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <AuthKeyboardView>
        <Card style={styles.card}>
          <AppText variant="title" style={styles.title}>
            Create Account
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
            placeholder="Password (min 6 chars)"
            value={password}
            onChangeText={handlePasswordChange}
            secureTextEntry
            autoCapitalize="none"
            error={passwordError}
          />

          <TextField
            label="Confirm Password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChangeText={handleConfirmChange}
            secureTextEntry
            autoCapitalize="none"
            error={confirmError}
          />

          <TextField
            label="Username"
            placeholder="Username (required)"
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
            error={usernameError}
          />

          {checkingUsername ? (
            <ActivityIndicator size="small" color={theme.accent} style={styles.statusIndicator} />
          ) : username.length >= 3 && !usernameError ? (
            <AppText color={theme.success} style={styles.statusText}>
              Username available!
            </AppText>
          ) : null}

          {formError ? (
            <AppText color={theme.danger} style={styles.formError}>
              {formError}
            </AppText>
          ) : null}

          {submitting ? (
            <ActivityIndicator color={theme.accent} style={styles.loader} />
          ) : (
            <Button
              label="Create Account"
              onPress={handleSignUp}
              disabled={!canSubmit}
              fullWidth
            />
          )}

          <TouchableOpacity onPress={() => router.push('/signin')}>
            <AppText variant="muted" style={styles.linkText}>
              Already have an account?{' '}
              <AppText variant="link" style={styles.linkHighlight}>
                Sign in
              </AppText>
            </AppText>
          </TouchableOpacity>
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
  statusIndicator: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  statusText: {
    marginBottom: 10,
  },
  formError: {
    marginBottom: 8,
  },
  loader: {
    marginVertical: 16,
  },
  linkText: {
    textAlign: 'center',
    marginTop: 16,
  },
  linkHighlight: {
    fontWeight: '700',
  },
});
