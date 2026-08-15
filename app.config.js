require('dotenv').config();

export default {
  expo: {
    name: 'Bible Review',
    slug: 'biblereviewapp',
    scheme: 'biblereviewapp',
    version: '0.11.0-beta',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    icon: './assets/images/icon.png',
    // Square splash asset — Android 12+ shows this inside a circle, so the
    // whole book must fit within that circular safe zone (not a wide crop).
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#000000',
    },
    android: {
      package: 'com.jbaldon.biblereviewapp',
      versionCode: 2,
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#000000',
      },
      splash: {
        image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
        imageWidth: 200,
      },
    },
    ios: {
      splash: {
        image: './assets/images/splash.png',
        resizeMode: 'contain',
        backgroundColor: '#000000',
      },
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      [
        'expo-speech-recognition',
        {
          microphonePermission: 'Allow Bible Review to use the microphone for voice answers.',
          speechRecognitionPermission: 'Allow Bible Review to use speech recognition for voice answers.',
        },
      ],
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash.png',
          backgroundColor: '#000000',
          resizeMode: 'contain',
          imageWidth: 200,
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
