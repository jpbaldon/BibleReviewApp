require('dotenv').config();

export default {
  expo: {
    name: "BibleReviewApp",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,  // Changed to EXPO_PUBLIC_
      supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY,  // Changed to EXPO_PUBLIC_
      eas: {projectId: "fa78ab2c-9fd2-433c-8520-e850401d7d3d"}
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