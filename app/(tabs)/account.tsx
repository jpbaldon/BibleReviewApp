import { Image, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Switch, View } from 'react-native';
import { useThemeContext } from '@/context/ThemeContext';

export default function Settings() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { colorScheme, setColorScheme } = useThemeContext();

  const handleSwitchAccount = async (router: any) => {
    await signOut();
    
    //router.replace('/signin');
  };

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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Account</ThemedText>
      </ThemedView>

      <ThemedView style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}>
          <Text style={{ color: '#fff', fontSize: 16 }}>Dark Mode</Text>
          <Switch
            value={colorScheme === 'dark'}
            onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
            thumbColor="#fff"
            trackColor={{ false: '#767577', true: '#81b0ff' }}
          />
        </View>
      </ThemedView>

      <ThemedView style={{ marginTop: 40 }}>
        <TouchableOpacity
          onPress={() => handleSwitchAccount(router)}
          style={{
            backgroundColor: '#0000FF',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8,
            alignItems: 'center',
          }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Switch Account</Text>
        </TouchableOpacity>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
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
  press: {
    color: 'white',
  }
});
