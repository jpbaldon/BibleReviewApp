import React, { type ReactNode } from 'react';
import {
  Pressable,
  View,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import { AppText } from './AppText';

interface ListRowProps {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  showDivider?: boolean;
}

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
  style,
  showDivider = true,
}: ListRowProps) {
  const { theme } = useThemeContext();

  const content = (
    <View
      style={[
        styles.row,
        showDivider && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.border,
        },
        style,
      ]}
    >
      <View style={styles.textBlock}>
        <AppText variant="body">{title}</AppText>
        {subtitle ? (
          <AppText variant="caption" style={styles.subtitle}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {right}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          pressed && { backgroundColor: theme.accentMuted, opacity: 0.85 },
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 4,
    minHeight: 48,
  },
  textBlock: {
    flex: 1,
    paddingRight: 12,
  },
  subtitle: {
    marginTop: 2,
  },
});
