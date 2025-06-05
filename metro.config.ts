const { getDefaultConfig } = require('expo/metro-config');
/**@type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

/** config.resolver.extraNodeModules = {
  stream: require.resolve('stream-browserify'),
  crypto: require.resolve('react-native-crypto'),
  http: require.resolve('stream-http'),
  https: require.resolve('https-browserify'),
  zlib: require.resolve('browserify-zlib'),
  path: require.resolve('path-browserify'),
  vm: require.resolve('vm-browserify')
};

config.transformer.getTransformOptions = async () => ({
  transform: {
    experimentalImportSupport: false,
    inlineRequires: true,
  },
}); */

config.resolver.unstable_enablePackageExports = false;

module.exports = config;