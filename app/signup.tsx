import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const router = useRouter();
  const { signUp, checkUsernameAvailability } = useAuth();

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
      // Final username availability check
      const available = await checkUsernameAvailability(username);
      if (!available) {
        Alert.alert('Error', 'Username is no longer available');
        return;
      }

      await signUp(email, password, username.trim());

      Alert.alert('Success', 'Account created successfully!');
    
      router.replace({
        pathname: '/verifyemail',
        params: { email: email }});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Create Account</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#000000"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password (min 6 chars)"
            placeholderTextColor="#000000"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          
          <TextInput
            style={[styles.input, usernameError ? styles.inputError : null]}
            placeholder="Username (required)"
            placeholderTextColor="#000000"
            value={username}
            onChangeText={handleUsernameChange}
            autoCapitalize="none"
          />
          
          {checkingUsername ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : username.length >= 3 && !usernameError ? (
            <Text style={styles.successText}>Username available!</Text>
          ) : null}
          
          <TouchableOpacity 
            style={[
              styles.button, 
              (!!usernameError || !username || submitting) ? styles.buttonDisabled : null
            ]} 
            onPress={handleSignUp}
            disabled={!!usernameError || !username || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/signin')}>
                          <Text style={styles.linkText}>
                          Already have an account? <Text style={styles.linkHighlight}>Sign in</Text>
                          </Text>
                          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    marginBottom: 10,
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ff4444',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 20,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 10,
  },
  successText: {
    color: '#4CAF50',
    marginBottom: 10,
  },
  linkText: {
    textAlign: 'center',
    color: '#555',
    marginTop: 15,
  },
  
  linkHighlight: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});