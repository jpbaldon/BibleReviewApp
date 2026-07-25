import React, { type ReactNode } from 'react';
import { View, type ViewProps, StyleSheet } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: 'surface' | 'scripture';
  padded?: boolean;
}

export function Card({
  children,
  style,
  variant = 'surface',
  padded = true,
  ...rest
}: CardProps) {
  const { theme } = useThemeContext();
  const backgroundColor =
    variant === 'scripture' ? theme.scripture : theme.surface;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: theme.border,
          shadowColor: theme.text,
        },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  padded: {
    padding: 16,
  },
});
