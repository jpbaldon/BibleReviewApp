require('dotenv').config();

export default {
  expo: {
    name: 'Bible Review',
    slug: 'BibleReviewApp',
    scheme: 'biblereviewapp',
    version: '0.10.0-beta',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/images/icon.png',
    splash: {
      image: './assets/images/biblelogo.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    android: {
      package: 'com.jbaldon.biblereviewapp',
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      splash: {
        image: './assets/images/biblelogo.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
      },
    },
    ios: {
      splash: {
        image: './assets/images/biblelogo.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
      },
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/biblelogo.png',
          backgroundColor: '#000000',
          resizeMode: 'contain',
        },
      ],
    ],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,
      eas: { projectId: 'fa78ab2c-9fd2-433c-8520-e850401d7d3d' },
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
  },
};
