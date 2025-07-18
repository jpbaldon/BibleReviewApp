import { Image, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useNavigation } from '@react-navigation/native';
import 'react-native-reanimated';
import { useThemeContext } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';


type LinkItem = {
  id: string;
  title: string;
  route: string; // Define the type for route as a string
};

export default function HomeScreen() {

  const { theme } = useThemeContext();

  const navigation = useNavigation();

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
      headerBackgroundColor={ theme.logoBackground }
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
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
                <Text style={{ color: theme.text, marginVertical: 10, fontSize: 18 }}>{item.title}</Text>
                <Icon
                  name="chevron-forward"
                  size={30}
                  color={theme.text}
                  style={{marginLeft: 8}}
                />
              </View> 
              <View style={{ height: 1, backgroundColor: theme.horizontalDivider }}></View>
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
