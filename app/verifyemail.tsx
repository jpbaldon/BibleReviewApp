import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import supabase from '../supabaseClient';

export default function VerifyEmailScreen() {

  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string;
  const [loading, setLoading] = useState(false);
  const [cooldown, setCoolDown] = useState(0);

  const handleResendEmail = async () => {
    if(cooldown > 0) return;

    setLoading(true);
    try {
        const { error } = await supabase.auth.resend({
            type: 'signup',
            email: email,
        });

        if (error) throw error;

        Alert.alert('Success', 'Verification email resent successfully!');

        setCoolDown(60);
        const interval = setInterval(() => {
            setCoolDown(prev => {
                if(prev <= 1) clearInterval(interval);
                return prev - 1;
            });
        }, 1000);
    } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Failed to resend verification email');
    } finally {
        setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <MaterialIcons name="mark-email-read" size={72} color="#4CAF50" style={styles.icon} />
      
      <Text style={styles.title}>Verify Your Email</Text>
      
      <Text style={styles.message}>We've sent a verification link to</Text>
      <Text style={[styles.message, styles.email]}>{email}</Text>
      <Text style={styles.message}>Please check your inbox and click the link to verify your account.</Text>
      
      <Text style={styles.note}>
        If you don't see the email, check your spam folder or click the resend button below.
      </Text>
      
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/signin')}>
        <Text style={styles.buttonText}>Go to Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.secondaryButton,
          cooldown > 0 && styles.disabledButton
        ]} 
        onPress={handleResendEmail}
        disabled={loading || cooldown > 0}
      >
        {loading ? (
          <ActivityIndicator color="#4CAF50" />
        ) : (
          <Text style={styles.secondaryButtonText}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
          </Text>
        )}
      </TouchableOpacity>
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    lineHeight: 24,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
    color: '#777',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  secondaryButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  disabledButton: {
    opacity: 0.6,
    borderColor: '#cccccc',
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: 16,
  },
  email: {
  fontWeight: 'bold',
  color: '#333',
  textAlign: 'center',
},
});