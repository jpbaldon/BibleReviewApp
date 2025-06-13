require('dotenv').config();

export default {
  expo: {
    name: "BibleReviewApp",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,  // Changed to EXPO_PUBLIC_
      supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,  // Changed to EXPO_PUBLIC_
    },
    scheme: "biblereviewapp",
    plugins: ["expo-router"],
    android: {
      package: "com.jbaldon.biblereviewapp",
      edgeToEdge: true,
    },
    runtimeVersion: {
      policy: 'sdkVersion',
    },
  },
};