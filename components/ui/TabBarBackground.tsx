// This is a shim for web and Android where the tab bar is generally opaque.
import { View } from 'react-native';

export const TabBarBackground = ({ color = 'black' }: { color?: string }) => (
  <View style={{ flex: 1, backgroundColor: color }} />
);

export function useBottomTabOverflow() {
  return 0;
}
