import React, { useRef } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  View,
  Animated,
  Easing,
} from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

interface LongPressButtonProps {
  onLongPress: () => void;
  duration?: number;
  label?: string;
}

export const LongPressButton: React.FC<LongPressButtonProps> = ({
  onLongPress,
  duration = 1200,
  label = 'Try Another',
}) => {
  const { theme } = useThemeContext();
  const progress = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const startHold = () => {
    progress.setValue(0);

    animationRef.current = Animated.timing(progress, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animationRef.current.start();

    timeoutRef.current = setTimeout(() => {
      onLongPress();
      reset();
    }, duration);
  };

  const cancelHold = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    animationRef.current?.stop();
    reset();
  };

  const reset = () => {
    progress.setValue(0);
  };

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable
      onPressIn={startHold}
      onPressOut={cancelHold}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.button,
          {
            backgroundColor: theme.accent,
            borderBottomColor: theme.accentPressed,
            shadowColor: theme.accentShadow,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: fillWidth,
              backgroundColor: theme.accentPressed,
            },
          ]}
        />
        <Text style={[styles.label, { color: '#FFFFFF' }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 10,
  },
  button: {
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderBottomWidth: 3,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 5,
  },
  progressFill: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    zIndex: 1,
  },
});
