import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import type { ThemeColors } from '@/constants/Colors';
import { useThemeContext } from '@/context/ThemeContext';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Build a StyleSheet from the current theme. Recreates styles when the theme changes.
 */
export function useThemedStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  factory: (theme: ThemeColors) => T,
): T {
  const { theme } = useThemeContext();
  return useMemo(() => StyleSheet.create(factory(theme)), [theme, factory]);
}

/**
 * Non-hook helper for building styles outside components (or when theme is already in hand).
 */
export function makeStyles<T extends NamedStyles<T> | NamedStyles<any>>(
  theme: ThemeColors,
  factory: (theme: ThemeColors) => T,
): T {
  return StyleSheet.create(factory(theme));
}
