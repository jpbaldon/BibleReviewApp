import React from 'react';
import { View, Image, Text, ActivityIndicator, StyleSheet } from 'react-native';

const LOGO = require('../assets/images/biblelogo.png');

interface AppLoadingScreenProps {
  message?: string;
}

/**
 * Branded full-screen loader used while fonts/auth boot, and as a
 * stand-in that matches the native splash look.
 */
export const AppLoadingScreen: React.FC<AppLoadingScreenProps> = ({
  message = 'Loading…',
}) => {
  return (
    <View style={styles.root} accessibilityRole="progressbar" accessibilityLabel={message}>
      <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Bible Review</Text>
      <ActivityIndicator size="large" color="#3B82F6" style={styles.spinner} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    width: 280,
    height: 160,
    marginBottom: 12,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 28,
  },
  spinner: {
    marginBottom: 12,
  },
  message: {
    color: '#94A3B8',
    fontSize: 14,
  },
});
