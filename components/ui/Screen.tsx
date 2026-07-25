import React, { type ReactNode } from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useThemeContext } from '@/context/ThemeContext';

interface ScreenProps extends ViewProps {
  children: ReactNode;
  /** Use SafeAreaView (default true) */
  safe?: boolean;
  /** Which safe-area edges to apply when safe=true. Default all. */
  edges?: Edge[];
  padded?: boolean;
}

export function Screen({
  children,
  style,
  safe = true,
  edges,
  padded = false,
  ...rest
}: ScreenProps) {
  const { theme } = useThemeContext();

  if (!safe) {
    return (
      <View
        style={[
          styles.base,
          { backgroundColor: theme.background },
          padded && styles.padded,
          style,
        ]}
        {...rest}
      >
        {children}
      </View>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      style={[
        styles.base,
        { backgroundColor: theme.background },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});
