import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import { AppText } from './AppText';

type BadgeTone = 'accent' | 'success' | 'danger' | 'warning' | 'neutral' | 'competitive';

interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: StyleProp<ViewStyle>;
}

export function Badge({ label, tone = 'accent', style }: BadgeProps) {
  const { theme } = useThemeContext();

  const { bg, fg } = (() => {
    switch (tone) {
      case 'success':
        return { bg: theme.success + '22', fg: theme.success };
      case 'danger':
        return { bg: theme.danger + '22', fg: theme.danger };
      case 'warning':
        return { bg: theme.warning + '22', fg: theme.warning };
      case 'competitive':
        return { bg: theme.competitive + '22', fg: theme.competitive };
      case 'neutral':
        return { bg: theme.border, fg: theme.textMuted };
      case 'accent':
      default:
        return { bg: theme.accentMuted, fg: theme.accent };
    }
  })();

  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <AppText variant="caption" color={fg} style={styles.label}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});
