import React, { useState } from 'react';
import supabase from '../supabaseClient';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const router = useRouter();

  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) return false;

    setCheckingUsername(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.trim())
        .maybeSingle();

      if (error) throw error;
      return !data;
    } catch (error) {
      console.error('Error checking username:', error);
      return false;
    } finally {
      setCheckingUsername(false);
    }
  };

  const validateUsername = (text: string) => {
    if (text.length > 0 && text.length < 3) {
      return 'Username must be at least 3 characters';
    }
    if (/\s/.test(text)) {
      return 'Username cannot contain spaces';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(text)) {
      return 'Only letters, numbers and underscores allowed';
    }
    return '';
  };

  const handleUsernameChange = async (text: string) => {
    setUsername(text);
    const validationError = validateUsername(text);
    setUsernameError(validationError);

    if (!validationError && text.length >= 3) {
      const available = await checkUsernameAvailability(text);
      setUsernameError(available ? '' : 'Username is taken');
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

    setLoading(true);
    try {
      // Final username availability check
      const available = await checkUsernameAvailability(username);
      if (!available) {
        Alert.alert('Error', 'Username is no longer available');
        return;
      }

      // Create auth user with username in metadata
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username.trim()
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('User creation failed');

      // Verify profile was created by trigger
      let profileExists = false;
      let attempts = 0;
      while (attempts < 3 && !profileExists) {
        attempts++;
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle();
        profileExists = !!profileData;
        if (!profileExists) await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Create profile manually if trigger failed
      if (!profileExists) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            username: username.trim(),
            overall_score: 0
          });

        if (profileError) throw profileError;
      }

      Alert.alert('Success', 'Account created successfully!');
      router.replace({
        pathname: '/verifyemail',
        params: { email: email }});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Signup failed';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
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
              (!!usernameError || !username || loading) ? styles.buttonDisabled : null
            ]} 
            onPress={handleSignUp}
            disabled={!!usernameError || !username || loading}
          >
            {loading ? (
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