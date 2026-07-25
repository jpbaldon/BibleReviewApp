/**
 * Resolves a theme color from ThemeContext (not system Appearance).
 */

import { useThemeContext } from '@/context/ThemeContext';
import type { ThemeColors } from '@/constants/Colors';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors,
) {
  const { colorScheme, theme } = useThemeContext();
  const colorFromProps = props[colorScheme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return theme[colorName];
}
