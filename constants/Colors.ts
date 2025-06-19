/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#000000',
    linkText: '#000000',
    disabledLinkText: '#888888',
    disabledButtonText: '#666666',
    highlightedText: '#ff8c00',
    fadedText: '#333333',
    logoBackground: '#A1CEDC',
    background: '#ffffff',
    secondary: '#d1d1d1',
    tint: tintColorLight,
    icon: '#9BA1A6',
    tabBarBackground: '#f1f1f1',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorLight,
    horizontalDivider: '#7FB6C6',
    neutralButton: '#2196F3',
  },
  dark: {
    text: '#ECEDEE',
    linkText: '#ffffff',
    disabledLinkText: '#888888',
    disabledButtonText: '#666666',
    highlightedText: 'yellow',
    fadedText: '#dddddd',
    logoBackground: '#1D3D47',
    background: '#000000',
    secondary: '#2e2e2e',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabBarBackground: '#111111',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    horizontalDivider: 'papayawhip',
    neutralButton: '#2196F3',
  },
};
