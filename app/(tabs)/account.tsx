import { Image, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { TouchableOpacity, Text, Alert, View } from 'react-native';
import { useRouter } from 'expo-router';
import supabase from '../../supabaseClient';

const handleSwitchAccount = async (router: any) => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    Alert.alert('Error', error.message);
  } else {
    router.replace('/signin'); // adjust path if needed
  }
};

export default function Settings() {
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
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Account</ThemedText>
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
