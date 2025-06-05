import { Image, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';

export default function About() {
  const router = useRouter();

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/biblelogo.png')}
          style={styles.bibleLogo}
          resizeMode="contain"
        />
      }>

      <View>
        <Text style={styles.welcomeText}>Welcome!</Text>
        <Text style={styles.bodyText}>This app is designed to test your knowledge of each chapter of the Bible.
            From the Home screen, navigate to either the Verses tab or the Summaries tab.
        </Text>
        <Text style={styles.bodyText}>The Verses tab will give you a verse from one of the Bible books you have enabled.
            Guessing the chapter where the verse is found correctly on your first attempt will earn you points!
        </Text>
        <Text style={styles.bodyText}>The Summaries tab works the same way, except that you will be given a summary of a
            Bible chapter instead of a verse.
        </Text>
        <Text style={styles.bodyText}>I hope this app is a fun way to help develop your knowledge of the Scripture!
        </Text>
      </View>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  welcomeText: {
    color: 'white',
    fontSize: 20,
    marginBottom: 15,
  },
  bodyText: {
    color: 'white',
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
