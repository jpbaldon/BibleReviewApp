import { Image, StyleSheet, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '../../context/ThemeContext';
import Constants from 'expo-constants';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';

export default function About() {
  const { theme } = useThemeContext();
  const insets = useSafeAreaInsets();
  const version = Constants.expoConfig?.version;

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
        <AppText variant="caption" style={styles.version}>
          Version: {version}
        </AppText>
        <AppText variant="subtitle" style={styles.welcome}>
          Welcome!
        </AppText>
        <Card>
          <AppText style={styles.body}>
            This app is designed to test your knowledge of each chapter of the Bible.
          </AppText>
          <AppText style={styles.body}>
            The Summaries tab will give you a summary of a chapter you have enabled.
            Correctly guessing the book and chapter corresponding to the summary within three
            attempts earns you points. The fewer attempts you use, the more points you earn!
          </AppText>
          <AppText style={styles.body}>
            The Verses tab works the same way, except that you will be given a verse from a
            Bible chapter instead of a chapter summary. The Verses tab is worth double points.
          </AppText>
          <AppText style={styles.body}>
            Competitive timers let you race the clock in three modes: Full Bible, Old Testament,
            or New Testament. While a competitive timer is active, prompts are pulled from every
            chapter in that scope, regardless of which books you have enabled. Each mode has its
            own personal best and leaderboard.
          </AppText>
          <AppText style={styles.body}>
            I hope this app is a fun way to help develop your knowledge of the Scripture!
          </AppText>
        </Card>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bibleLogo: {
    height: 140,
    width: 280,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  version: {
    marginBottom: 8,
  },
  welcome: {
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
});
