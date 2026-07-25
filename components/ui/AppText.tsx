import React from 'react';
import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

export type AppTextVariant =
  | 'body'
  | 'bodyBold'
  | 'title'
  | 'subtitle'
  | 'caption'
  | 'link'
  | 'muted';

interface AppTextProps extends TextProps {
  variant?: AppTextVariant;
  color?: string;
}

export function AppText({
  variant = 'body',
  color,
  style,
  ...rest
}: AppTextProps) {
  const { theme } = useThemeContext();
  const resolvedColor =
    color ??
    (variant === 'link'
      ? theme.accent
      : variant === 'muted' || variant === 'caption'
        ? theme.textMuted
        : theme.text);

  return (
    <Text
      style={[
        styles[variant],
        { color: resolvedColor },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    lineHeight: 18,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
  },
});
