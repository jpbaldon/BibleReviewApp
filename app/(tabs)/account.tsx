import { Image, StyleSheet, ScrollView, Switch, View, TouchableOpacity, Text, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useThemeContext } from '@/context/ThemeContext';
import { useSettings } from '../../context/SettingsContext';
import type { TranslationKey } from '../../data/translations';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const TRANSLATIONS: { key: TranslationKey; label: string }[] = [
  { key: 'BSB', label: 'BSB' },
  { key: 'ASV', label: 'ASV' },
];

export default function Settings() {
  const { signOut, deleteAccount } = useAuth();
  const { colorScheme, setColorScheme, theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const {
    holdToTryAnother,
    setHoldToTryAnotherSetting,
    soundEnabled,
    setSoundEnabledSetting,
    translation,
    setTranslationSetting,
  } = useSettings();

  const handleSwitchAccount = async () => {
    await signOut();
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteAccount() },
      ],
    );
  };

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.logoBackground,
            paddingTop: insets.top,
          },
        ]}
      >
        <Image
          source={require('@/assets/images/biblelogo.png')}
          style={styles.bibleLogo}
          resizeMode="contain"
        />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title" style={styles.title}>
          Account
        </AppText>

        <Card style={styles.card}>
          <View style={styles.row}>
            <AppText>Dark Mode</AppText>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
              thumbColor={colorScheme === 'dark' ? '#FAFAF9' : '#FFFFFF'}
              trackColor={{ false: theme.textDisabled, true: theme.accent }}
              ios_backgroundColor={theme.textDisabled}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.row}>
            <AppText>Hold to Try Another</AppText>
            <Switch
              value={holdToTryAnother}
              onValueChange={setHoldToTryAnotherSetting}
              thumbColor={colorScheme === 'dark' ? '#FAFAF9' : '#FFFFFF'}
              trackColor={{ false: theme.textDisabled, true: theme.accent }}
              ios_backgroundColor={theme.textDisabled}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.row}>
            <AppText>App Sounds</AppText>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabledSetting}
              thumbColor={colorScheme === 'dark' ? '#FAFAF9' : '#FFFFFF'}
              trackColor={{ false: theme.textDisabled, true: theme.accent }}
              ios_backgroundColor={theme.textDisabled}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <AppText style={styles.sectionLabel}>Bible Translation</AppText>
          <View style={styles.translationRow}>
            {TRANSLATIONS.map(({ key, label }) => {
              const selected = translation === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => setTranslationSetting(key)}
                  style={[
                    styles.translationChip,
                    {
                      backgroundColor: selected ? theme.accent : theme.surface,
                      borderColor: selected ? theme.accent : theme.border,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontWeight: '700',
                      color: selected ? '#FFFFFF' : theme.text,
                    }}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Button
          label="Switch Account"
          variant="primary"
          onPress={handleSwitchAccount}
          fullWidth
          style={styles.action}
        />
        <Button
          label="Delete My Account"
          variant="danger"
          onPress={handleDeleteAccount}
          fullWidth
          style={styles.action}
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bibleLogo: {
    height: 120,
    width: 260,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  sectionLabel: {
    marginBottom: 10,
    marginTop: 4,
  },
  translationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  translationChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  action: {
    marginTop: 8,
  },
});
