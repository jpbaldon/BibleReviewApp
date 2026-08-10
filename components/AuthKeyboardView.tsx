import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AuthKeyboardViewProps {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Keeps auth forms visible above the keyboard without KeyboardAvoidingView.
 *
 * Expo Go often ignores the native project's adjustResize, and KAV "height"
 * left a large black gap. We pad by only the keyboard height that is NOT
 * already accounted for by a window resize, then pin content to the top
 * while the keyboard is open so fields stay in the visible area.
 */
export function AuthKeyboardView({
  children,
  contentContainerStyle,
}: AuthKeyboardViewProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const restingWindowHeightRef = useRef(windowHeight);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const keyboardOpen = keyboardHeight > 0;

  useEffect(() => {
    if (!keyboardOpen) {
      restingWindowHeightRef.current = windowHeight;
    }
  }, [keyboardOpen, windowHeight]);

  // If adjustResize already shrank the window, don't double-pad (black gap).
  const resizedByKeyboard = keyboardOpen
    ? Math.max(0, restingWindowHeightRef.current - windowHeight)
    : 0;
  const uncoveredKeyboard = Math.max(0, keyboardHeight - resizedByKeyboard);
  // Extra gap so the last control (e.g. sign-in link) isn't flush with the keyboard.
  const keyboardGap = 40;
  const bottomPad = keyboardOpen
    ? Math.max(
        keyboardGap,
        uncoveredKeyboard -
          (Platform.OS === 'android' ? insets.bottom : 0) +
          keyboardGap,
      )
    : 20;

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.content,
        keyboardOpen && styles.contentKeyboardOpen,
        { paddingBottom: bottomPad },
        contentContainerStyle,
      ]}
      keyboardShouldPersistTaps="handled"
      // Keep keyboard open while scrolling so users can nudge tall forms
      // (sign-up) without losing focus.
      keyboardDismissMode="none"
      showsVerticalScrollIndicator={false}
      bounces={false}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  contentKeyboardOpen: {
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
});
