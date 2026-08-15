import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeContext } from '../context/ThemeContext';

interface VoiceAnswerButtonProps {
  disabled?: boolean;
  isListening: boolean;
  onPress: () => void;
}

export const VoiceAnswerButton: React.FC<VoiceAnswerButtonProps> = ({
  disabled = false,
  isListening,
  onPress,
}) => {
  const { theme } = useThemeContext();

  return (
    <TouchableOpacity
      accessibilityLabel={isListening ? 'Submit voice answer' : 'Answer with voice'}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        {
          backgroundColor: disabled ? theme.border : theme.surface,
          borderColor: isListening ? theme.accent : theme.border,
          shadowColor: theme.text,
        },
      ]}
    >
      <View style={styles.content}>
        {isListening ? (
          <ActivityIndicator color={theme.accent} size="small" />
        ) : (
          <Icon
            color={disabled ? theme.textDisabled : theme.accent}
            name="mic-outline"
            size={22}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 52,
    marginLeft: 8,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  content: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
