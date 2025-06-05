import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { Colors } from '../constants/Colors';

type ThemeContextType = {
  colorScheme: 'light' | 'dark' | null | undefined;
  setColorScheme: (scheme: 'light' | 'dark') => void;
  theme: typeof Colors.light | typeof Colors.dark;
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
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  const theme = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};