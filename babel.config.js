module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    'react-native-reanimated/plugin',
    require.resolve('expo-router/babel'), 
  ],
};