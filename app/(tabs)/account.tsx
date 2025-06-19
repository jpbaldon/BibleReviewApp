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
  const { colorScheme, setColorScheme, theme } = useThemeContext();

  const handleSwitchAccount = async (router: any) => {
    await signOut();
    
    //router.replace('/signin');
  };

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
      <ThemedView style={[styles.titleContainer, {backgroundColor: theme.background}]}>
        <ThemedText type="title" style={{color: theme.text}}>Account</ThemedText>
      </ThemedView>

      <ThemedView style={{ marginTop: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: theme.background }}>
          <Text style={{ color: theme.text, fontSize: 16 }}>Dark Mode</Text>
          <Switch
            value={colorScheme === 'dark'}
            onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
            thumbColor="#228B22"
            trackColor={{ false: '#999999', true: '#98FF98' }}
          />
        </View>
      </ThemedView>

      <ThemedView style={{ marginTop: 40, backgroundColor: theme.background }}>
        <TouchableOpacity
          onPress={() => handleSwitchAccount(router)}
          style={{
            backgroundColor: theme.neutralButton,
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
