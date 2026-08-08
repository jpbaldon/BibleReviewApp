import React from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  type TextInputProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';
import { AppText } from './AppText';

interface TextFieldProps extends TextInputProps {
  label?: string;
  /** Inline validation message shown under the input. */
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

export function TextField({
  label,
  error,
  style,
  containerStyle,
  ...rest
}: TextFieldProps) {
  const { theme } = useThemeContext();
  const hasError = Boolean(error);

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <AppText variant="caption" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.textDisabled}
        style={[
          styles.input,
          {
            backgroundColor: theme.surface,
            borderColor: hasError ? theme.danger : theme.border,
            color: theme.text,
          },
          style,
        ]}
        {...rest}
      />
      {hasError ? (
        <AppText color={theme.danger} style={styles.errorText}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  label: {
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    minHeight: 48,
  },
  errorText: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 18,
  },
});
