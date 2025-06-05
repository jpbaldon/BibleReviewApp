import { Image, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from '@react-navigation/native';
import 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { Redirect } from 'expo-router';
import { useThemeContext } from '../../context/ThemeContext';


type LinkItem = {
  id: string;
  title: string;
  route: string; // Define the type for route as a string
};

export default function HomeScreen() {

  const { theme } = useThemeContext();
  const { user } = useAuth();

  const navigation = useNavigation();

  if(!user) {
    return <Redirect href="/signin"/>
  }

  const links: LinkItem[] = [
    { id: '1', title: 'About', route: 'about' },
    { id: '2', title: 'Account', route: 'account' },
    { id: '3', title: 'Enabled Books', route: 'enabledBooks' },
    { id: '4', title: 'Leader Board', route: 'leaderboard'}
  ];

  const handlePress = (route: string) => {
    navigation.navigate(route as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
    <ParallaxScrollView
      headerBackgroundColor={{ dark: '#A1CEDC', light: '#A1CEDC' }}
      headerImage={
        <Image
          source={require('@/assets/images/biblelogo.png')}
          style={styles.bibleLogo}
          resizeMode="contain"
        />
      }
      >
        <ThemedView style={[styles.titleContainer, {backgroundColor: theme.background}]}>
          <ThemedText type="title" style={{color: theme.text}}>Bible Review</ThemedText>
        </ThemedView>
        <View style={{ padding: 10, backgroundColor: theme.background, flex: 1 }}>
          <View style={{ height: 1 }}></View>
          {links.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => handlePress(item.route)}> 
              <Text style={{ color: 'white', marginVertical: 10, fontSize: 18 }}>{item.title}</Text>
              <View style={{ height: 1, backgroundColor: 'papayawhip' }}></View>
            </TouchableOpacity>
          ))}
        </View>
    </ParallaxScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
});
