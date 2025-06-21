import { Image, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Text, View } from 'react-native';
import { useThemeContext } from '../../context/ThemeContext';

export default function About() {
  const { theme } = useThemeContext();

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
        <Text style={[styles.welcomeText, {color: theme.text}]}>Welcome!</Text>
        <Text style={[styles.bodyText, {color: theme.text}]}>This app is designed to test your knowledge of each chapter of the Bible.
        </Text>
        <Text style={[styles.bodyText, {color: theme.text}]}>The Verses tab will give you a verse from one of the Bible books you have enabled.
            Guessing the chapter where the verse is found correctly within three attempts earns you points. The fewer attempts you use, the more points you earn!
        </Text>
        <Text style={[styles.bodyText, {color: theme.text}]}>The Summaries tab works the same way, except that you will be given a summary of a
            Bible chapter instead of a verse.
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
  }
});
