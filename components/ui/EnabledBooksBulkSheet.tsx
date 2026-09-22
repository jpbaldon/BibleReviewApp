import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { useThemeContext } from '@/context/ThemeContext';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface EnabledBooksBulkSheetProps {
  visible: boolean;
  onClose: () => void;
  bulkActionInFlight: boolean;
  savedEnabledBooks: string[] | null;
  onEnableAll: () => void;
  onDisableAll: () => void;
  onInvertAll: () => void;
  onSaveEnabledBooks: () => void;
  onEnableSavedBooks: () => void;
}

export function EnabledBooksBulkSheet({
  visible,
  onClose,
  bulkActionInFlight,
  savedEnabledBooks,
  onEnableAll,
  onDisableAll,
  onInvertAll,
  onSaveEnabledBooks,
  onEnableSavedBooks,
}: EnabledBooksBulkSheetProps) {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, translateY]);

  const runAndClose = (action: () => void) => {
    if (bulkActionInFlight) return;
    action();
    onClose();
  };

  const savedSetLabel = savedEnabledBooks === null
    ? 'No set saved'
    : `Saved: ${savedEnabledBooks.length} ${savedEnabledBooks.length === 1 ? 'book' : 'books'}`;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[
          styles.sheetContainer,
          {
            backgroundColor: theme.surface,
            paddingBottom: Math.max(insets.bottom, 16),
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <Text style={[styles.title, { color: theme.text }]}>Bulk Actions</Text>

        <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>Selection</Text>
        <Button
          label="Enable All Books"
          onPress={() => runAndClose(onEnableAll)}
          disabled={bulkActionInFlight}
          fullWidth
        />
        <Button
          label="Disable All Books"
          onPress={() => runAndClose(onDisableAll)}
          disabled={bulkActionInFlight}
          fullWidth
        />
        <Button
          label="Invert All Books"
          onPress={() => runAndClose(onInvertAll)}
          disabled={bulkActionInFlight}
          fullWidth
        />

        <Text style={[styles.sectionLabel, styles.sectionLabelSpaced, { color: theme.textMuted }]}>
          Saved Set
        </Text>
        <Text style={[styles.savedSetStatus, { color: theme.textMuted }]}>{savedSetLabel}</Text>
        <Button
          label="Save Enabled Books"
          onPress={() => runAndClose(onSaveEnabledBooks)}
          disabled={bulkActionInFlight}
          fullWidth
        />
        <Button
          label="Enable Saved Books"
          onPress={() => runAndClose(onEnableSavedBooks)}
          disabled={bulkActionInFlight || savedEnabledBooks === null}
          fullWidth
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  sectionLabelSpaced: {
    marginTop: 8,
  },
  savedSetStatus: {
    fontSize: 14,
    marginBottom: 8,
  },
});
