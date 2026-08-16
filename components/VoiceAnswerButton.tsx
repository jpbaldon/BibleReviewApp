import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeContext } from '../context/ThemeContext';

interface VoiceAnswerButtonProps {
  disabled?: boolean;
  isListening: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  onPress: () => void;
}

export const VoiceAnswerButton: React.FC<VoiceAnswerButtonProps> = ({
  disabled = false,
  isListening,
  onPressIn,
  onPressOut,
  onPress,
}) => {
  const { theme } = useThemeContext();
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      const enabled = await AccessibilityInfo.isScreenReaderEnabled();
      if (!ignore) {
        setScreenReaderEnabled(enabled);
      }
    };

    load().catch(() => {
      if (!ignore) {
        setScreenReaderEnabled(false);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled,
    );

    return () => {
      ignore = true;
      subscription.remove();
    };
  }, []);

  return (
    <Pressable
      accessibilityHint={
        screenReaderEnabled
          ? undefined
          : 'Hold to speak a book and chapter, then release to submit'
      }
      accessibilityLabel={
        isListening
          ? screenReaderEnabled
            ? 'Stop listening'
            : 'Release to submit voice answer'
          : screenReaderEnabled
            ? 'Answer with voice'
            : 'Hold to answer with voice'
      }
      accessibilityRole="button"
      android_disableSound
      disabled={disabled}
      onPress={screenReaderEnabled ? onPress : undefined}
      onPressIn={
        screenReaderEnabled
          ? undefined
          : () => {
              setIsPressed(true);
              onPressIn();
            }
      }
      onPressOut={
        screenReaderEnabled
          ? undefined
          : () => {
              setIsPressed(false);
              onPressOut();
            }
      }
      style={[
        styles.button,
        {
          backgroundColor: disabled ? theme.border : theme.surface,
          borderColor: isListening || isPressed ? theme.accent : theme.border,
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
    </Pressable>
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
