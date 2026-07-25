import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeContext } from '@/context/ThemeContext';
import type { ThemeColors } from '@/constants/Colors';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  label: string;
  variant?: ButtonVariant;
  /** Ionicons glyph name shown before the label */
  icon?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

type VariantColors = {
  fill: string;
  pressed: string;
  shadow: string;
  label: string;
  border?: string;
};

function resolveVariant(theme: ThemeColors, variant: ButtonVariant): VariantColors {
  switch (variant) {
    case 'secondary':
      return {
        fill: theme.surface,
        pressed: theme.background,
        shadow: 'rgba(26, 43, 72, 0.1)',
        label: theme.text,
        border: theme.border,
      };
    case 'danger':
      return {
        fill: theme.danger,
        pressed: theme.dangerPressed,
        shadow: theme.dangerShadow,
        label: '#FFFFFF',
      };
    case 'success':
      return {
        fill: theme.success,
        pressed: theme.successPressed,
        shadow: theme.successShadow,
        label: '#FFFFFF',
      };
    case 'primary':
    default:
      return {
        fill: theme.accent,
        pressed: theme.accentPressed,
        shadow: theme.accentShadow,
        label: '#FFFFFF',
      };
  }
}

/**
 * Dimensional raised button — bottom lip + press inset + visible shadow.
 */
export function Button({
  label,
  variant = 'primary',
  icon,
  disabled,
  style,
  textStyle,
  fullWidth = false,
  ...rest
}: ButtonProps) {
  const { theme } = useThemeContext();
  const colors = useMemo(() => resolveVariant(theme, variant), [theme, variant]);
  const isOutline = variant === 'secondary';
  const labelColor = disabled ? theme.textDisabled : colors.label;

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => {
        const isPressed = pressed && !disabled;
        return [
          styles.outer,
          fullWidth && styles.fullWidth,
          {
            backgroundColor: disabled
              ? theme.border
              : isPressed
                ? colors.pressed
                : colors.fill,
            borderBottomColor: disabled ? 'transparent' : colors.pressed,
            borderBottomWidth: disabled || isPressed ? 0 : 3,
            transform: [{ translateY: isPressed ? 2 : 0 }],
            shadowColor: colors.shadow,
            shadowOpacity: disabled ? 0 : isPressed ? 0.1 : 0.32,
            shadowRadius: disabled ? 0 : isPressed ? 2 : 6,
            shadowOffset: {
              width: 0,
              height: disabled ? 0 : isPressed ? 1 : 4,
            },
            elevation: disabled ? 0 : isPressed ? 1 : 5,
            borderWidth: isOutline ? 1 : 0,
            borderColor: isOutline ? colors.border : 'transparent',
            opacity: disabled ? 0.7 : 1,
          },
          style,
        ];
      }}
      {...rest}
    >
      <View style={styles.inner}>
        {icon ? (
          <Icon name={icon} size={18} color={labelColor} style={styles.icon} />
        ) : null}
        <Text style={[styles.label, { color: labelColor }, textStyle]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginVertical: 4,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  inner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
});
