import { View, type ViewProps } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

export type ThemedViewProps = ViewProps & {
  variant?: 'background' | 'surface' | 'scripture';
};

export function ThemedView({
  style,
  variant = 'background',
  ...otherProps
}: ThemedViewProps) {
  const { theme } = useThemeContext();
  const backgroundColor =
    variant === 'surface'
      ? theme.surface
      : variant === 'scripture'
        ? theme.scripture
        : theme.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
