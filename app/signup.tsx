import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SignUpScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [usernameError, setUsernameError] = useState<string>('');
  const [checkingUsername, setCheckingUsername] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const router = useRouter();
  const { signUp, checkUsernameAvailability } = useAuth();
  const { theme } = useThemeContext();

  const validateUsername = (text: string) => {
    if (text.length > 0 && text.length < 3) return 'Username must be at least 3 characters';
    if (/\s/.test(text)) return 'Username cannot contain spaces';
    if (!/^[a-zA-Z0-9_]+$/.test(text)) return 'Only letters, numbers and underscores allowed';
    return '';
  };

  const handleUsernameChange = async (text: string) => {
    setUsername(text);
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
    if (!email || !password || !username) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password should be at least 6 characters.');
      return;
    }

    if (usernameError) {
      Alert.alert('Error', 'Please fix username errors');
      return;
    }

    setSubmitting(true);
    try {
      const available = await checkUsernameAvailability(username.trim().toLowerCase());
      if (!available) {
        Alert.alert('Error', 'Username is no longer available');
        return;
      }

      await signUp(email, password, username.trim().toLowerCase());
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !usernameError && !!username && !submitting;

  return (
    <Screen>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Card style={styles.card}>
            <AppText variant="title" style={styles.title}>
              Create Account
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
              placeholder="Password (min 6 chars)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            <TextField
              label="Username"
              placeholder="Username (required)"
              value={username}
              onChangeText={handleUsernameChange}
              autoCapitalize="none"
              style={usernameError ? { borderColor: theme.danger } : undefined}
            />

            {checkingUsername ? (
              <ActivityIndicator size="small" color={theme.accent} />
            ) : usernameError ? (
              <AppText color={theme.danger} style={styles.statusText}>
                {usernameError}
              </AppText>
            ) : username.length >= 3 && !usernameError ? (
              <AppText color={theme.success} style={styles.statusText}>
                Username available!
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
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    paddingVertical: 8,
  },
  title: {
    marginBottom: 20,
    textAlign: 'center',
  },
  statusText: {
    marginBottom: 10,
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
