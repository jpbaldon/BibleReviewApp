import { Text, type TextProps, StyleSheet } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'muted';
};

export function ThemedText({
  style,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const { theme } = useThemeContext();
  const color =
    type === 'link'
      ? theme.accent
      : type === 'muted'
        ? theme.textMuted
        : theme.text;

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'muted' ? styles.muted : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
  },
});
