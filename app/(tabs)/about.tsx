import { Image, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Text, View } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';
import Constants from 'expo-constants';

export default function About() {
  const { theme } = useThemeContext();
  const version = Constants.expoConfig?.version;

  return (
    <ParallaxScrollView
      headerBackgroundColor={ theme.logoBackground }
      headerImage={
        <Image
          source={require('@/assets/images/biblelogo.png')}
          style={styles.bibleLogo}
          resizeMode="contain"
        />
      }>

      <View>
        <Text style={[styles.versionText, {color: theme.text}]}>Version: {version}</Text>
        <Text style={[styles.welcomeText, {color: theme.text}]}>Welcome!</Text>
        <Text style={[styles.bodyText, {color: theme.text}]}>This app is designed to test your knowledge of each chapter of the Bible.
        </Text>
        <Text style={[styles.bodyText, {color: theme.text}]}>The Summaries tab will give you a summary of a chapter you have enabled.
            Correctly guessing the book and chapter corresponding to the summary within three attempts earns you points. The fewer attempts you use, the more points you earn!
        </Text>
        <Text style={[styles.bodyText, {color: theme.text}]}>The Verses tab works the same way, except that you will be given a verse from a
            Bible chapter instead of a chapter summary. The Verses tab is worth double points.
        </Text>
        <Text style={[styles.bodyText, {color: theme.text}]}>I hope this app is a fun way to help develop your knowledge of the Scripture!
        </Text>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  welcomeText: {
    fontSize: 20,
    marginBottom: 15,
  },
  bodyText: {
    fontSize: 18,
    marginBottom: 7,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  bibleLogo: {
    height: 178,
    width: 420,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  press: {
    color: 'white',
  },
  versionText: {
    fontSize: 14,
    marginBottom: 15,
  },
});
