import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppText } from '@/components/ui/AppText';
import { Button, type ButtonVariant } from '@/components/ui/Button';
import { useThemeContext } from '@/context/ThemeContext';
import type { ThemeColors } from '@/constants/Colors';

export type AlertVariant = 'info' | 'success' | 'error' | 'warning';

export type AppAlertButton = {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertDialogState = {
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  variant: AlertVariant;
};

type ToastState = {
  id: number;
  title?: string;
  message: string;
  variant: AlertVariant;
};

type ShowAlertOptions = {
  title: string;
  message?: string;
  buttons?: AppAlertButton[];
  variant?: AlertVariant;
};

type ShowToastOptions = {
  title?: string;
  message: string;
  variant?: AlertVariant;
  duration?: number;
};

type AlertContextType = {
  /** Themed modal dialog — use for confirmations and messages that need acknowledgment. */
  showAlert: (options: ShowAlertOptions) => void;
  /** Non-blocking toast — use for validation errors and quick feedback. */
  showToast: (options: ShowToastOptions) => void;
  /** Drop-in replacement for React Native `Alert.alert`. */
  alert: (
    title: string,
    message?: string,
    buttons?: AppAlertButton[],
  ) => void;
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

const DEFAULT_BUTTONS: AppAlertButton[] = [{ text: 'OK', style: 'default' }];
const TOAST_DURATION_MS = 3000;

function inferVariant(title: string): AlertVariant {
  const t = title.toLowerCase();
  if (t.includes('success') || t.includes('enabled')) return 'success';
  if (t.includes('error') || t.includes('fail') || t.includes('invalid')) return 'error';
  if (t.includes('warning') || t.includes('limit') || t.includes('disabled')) return 'warning';
  return 'info';
}

function variantIcon(variant: AlertVariant): string {
  switch (variant) {
    case 'success':
      return 'checkmark-circle';
    case 'error':
      return 'alert-circle';
    case 'warning':
      return 'warning';
    case 'info':
    default:
      return 'information-circle';
  }
}

function variantColor(theme: ThemeColors, variant: AlertVariant): string {
  switch (variant) {
    case 'success':
      return theme.success;
    case 'error':
      return theme.danger;
    case 'warning':
      return theme.warning;
    case 'info':
    default:
      return theme.accent;
  }
}

function buttonVariant(style?: AppAlertButton['style']): ButtonVariant {
  if (style === 'destructive') return 'danger';
  if (style === 'cancel') return 'secondary';
  return 'primary';
}

export function useAlert(): AlertContextType {
  const ctx = useContext(AlertContext);
  if (!ctx) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return ctx;
}

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();

  const [dialog, setDialog] = useState<AlertDialogState | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const toastIdRef = useRef(0);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslate = useRef(new Animated.Value(-12)).current;

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearToastTimer();
    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslate, {
        toValue: -12,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [clearToastTimer, toastOpacity, toastTranslate]);

  const showToast = useCallback(
    ({ title, message, variant = 'info', duration = TOAST_DURATION_MS }: ShowToastOptions) => {
      clearToastTimer();
      toastIdRef.current += 1;
      setToast({
        id: toastIdRef.current,
        title,
        message,
        variant,
      });
      toastOpacity.setValue(0);
      toastTranslate.setValue(-12);
      Animated.parallel([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(toastTranslate, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      toastTimerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [clearToastTimer, hideToast, toastOpacity, toastTranslate],
  );

  const showAlert = useCallback(
    ({
      title,
      message,
      buttons = DEFAULT_BUTTONS,
      variant,
    }: ShowAlertOptions) => {
      setDialog({
        title,
        message,
        buttons: buttons.length > 0 ? buttons : DEFAULT_BUTTONS,
        variant: variant ?? inferVariant(title),
      });
    },
    [],
  );

  const alert = useCallback(
    (title: string, message?: string, buttons?: AppAlertButton[]) => {
      const resolvedButtons = buttons && buttons.length > 0 ? buttons : DEFAULT_BUTTONS;
      const variant = inferVariant(title);
      const onlyPassiveAck =
        resolvedButtons.length === 1 &&
        !resolvedButtons[0].onPress &&
        resolvedButtons[0].style !== 'destructive';

      // Passive one-button feedback → toast; anything with a handler or choice → modal.
      if (onlyPassiveAck) {
        showToast({
          title,
          message: message ?? '',
          variant,
        });
        return;
      }

      showAlert({ title, message, buttons: resolvedButtons, variant });
    },
    [showAlert, showToast],
  );

  const dismissDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const handleDialogButton = useCallback(
    (button: AppAlertButton) => {
      dismissDialog();
      // Let the modal close before running navigation / side effects.
      if (button.onPress) {
        setTimeout(() => button.onPress?.(), 0);
      }
    },
    [dismissDialog],
  );

  useEffect(() => {
    return () => clearToastTimer();
  }, [clearToastTimer]);

  const value = useMemo(
    () => ({ showAlert, showToast, alert }),
    [showAlert, showToast, alert],
  );

  const accent = dialog ? variantColor(theme, dialog.variant) : theme.accent;
  const toastAccent = toast ? variantColor(theme, toast.variant) : theme.accent;

  return (
    <AlertContext.Provider value={value}>
      {children}

      <Modal
        visible={dialog != null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (!dialog) return;
          const cancel = dialog.buttons.find((b) => b.style === 'cancel');
          handleDialogButton(cancel ?? dialog.buttons[0]);
        }}
      >
        <View style={styles.backdrop}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!dialog) return;
              const cancel = dialog.buttons.find((b) => b.style === 'cancel');
              // Backdrop dismisses cancel, or a lone OK — never a destructive confirm.
              if (cancel) {
                handleDialogButton(cancel);
              } else if (
                dialog.buttons.length === 1 &&
                dialog.buttons[0].style !== 'destructive'
              ) {
                handleDialogButton(dialog.buttons[0]);
              }
            }}
          />
          {dialog ? (
            <View
              style={[
                styles.dialog,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  shadowColor: theme.text,
                },
              ]}
            >
              <View style={[styles.iconBadge, { backgroundColor: `${accent}22` }]}>
                <Icon name={variantIcon(dialog.variant)} size={28} color={accent} />
              </View>
              <AppText variant="subtitle" style={styles.dialogTitle}>
                {dialog.title}
              </AppText>
              {dialog.message ? (
                <AppText variant="muted" style={styles.dialogMessage}>
                  {dialog.message}
                </AppText>
              ) : null}
              <View
                style={[
                  styles.dialogActions,
                  dialog.buttons.length > 2 && styles.dialogActionsStacked,
                ]}
              >
                {dialog.buttons.map((button, index) => (
                  <Button
                    key={`${button.text}-${index}`}
                    label={button.text}
                    variant={buttonVariant(button.style)}
                    onPress={() => handleDialogButton(button)}
                    style={[
                      styles.dialogButton,
                      dialog.buttons.length <= 2 && styles.dialogButtonRow,
                    ]}
                    fullWidth={dialog.buttons.length > 2}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.toastWrap,
            {
              top: insets.top + 8,
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslate }],
            },
          ]}
        >
          <Pressable
            onPress={hideToast}
            style={[
              styles.toast,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                shadowColor: theme.text,
                borderLeftColor: toastAccent,
              },
            ]}
          >
            <Icon
              name={variantIcon(toast.variant)}
              size={22}
              color={toastAccent}
              style={styles.toastIcon}
            />
            <View style={styles.toastText}>
              {toast.title ? (
                <AppText variant="bodyBold" style={styles.toastTitle}>
                  {toast.title}
                </AppText>
              ) : null}
              <AppText variant="muted" numberOfLines={4}>
                {toast.message}
              </AppText>
            </View>
          </Pressable>
        </Animated.View>
      ) : null}
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(26, 43, 72, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 16,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  dialogTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  dialogMessage: {
    textAlign: 'center',
    marginBottom: 18,
  },
  dialogActions: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  dialogActionsStacked: {
    flexDirection: 'column',
  },
  dialogButton: {
    marginVertical: 0,
  },
  dialogButtonRow: {
    flex: 1,
  },
  toastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: 4,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  toastIcon: {
    marginRight: 10,
    marginTop: 1,
  },
  toastText: {
    flex: 1,
  },
  toastTitle: {
    marginBottom: 2,
  },
});
