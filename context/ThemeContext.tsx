import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { Colors } from '../constants/Colors';

type ColorScheme = 'light' | 'dark';

type ThemeContextType = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: 'light' | 'dark') => void;
  theme: typeof Colors.light | typeof Colors.dark;
  loadUserTheme: (userId: string) => Promise<void>;
};

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const systemColorScheme = Appearance.getColorScheme();
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(systemColorScheme === 'dark' ? 'dark' : 'light');

  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  const setColorScheme = async (scheme: ColorScheme) => {
    try {
      const userId = await AsyncStorage.getItem('currentUserId');
      if(userId) {
        await AsyncStorage.setItem(`theme-${userId}`, scheme);
      }
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
    setColorSchemeState(scheme);
  }

  const loadUserTheme = async (userId: string) => {
    try {
      await AsyncStorage.setItem('currentUserId', userId);
      const saved = await AsyncStorage.getItem(`theme-${userId}`);
      if (saved === 'dark' || saved === 'light') {
        setColorSchemeState(saved);
      } else {
        setColorSchemeState(systemColorScheme === 'dark' ? 'dark' : 'light');
      }
    } catch (e) {
      console.error('Failed to load theme:', e);
    }
  };

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, theme, loadUserTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};