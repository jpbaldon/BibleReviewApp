import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { TabBarBackground } from '@/components/ui/TabBarBackground';
import { useThemeContext } from '../../context/ThemeContext';

export default function TabLayout() {
  const { theme } = useThemeContext();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        headerShown: false,
        headerTitleAlign: 'center',
        tabBarButton: HapticTab,
        tabBarBackground: () => <TabBarBackground color={theme.tabBarBackground} />,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="summaries"
        options={{
          title: 'Summaries',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="explore.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="verses"
        options={{
          title: 'Verses',
          tabBarIcon: ({ color }: { color: string }) => (
            <IconSymbol size={28} name="bookmark.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: 'About',
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          href: null,
        }}
      />
      <Tabs.Screen
        name="enabledBooks"
        options={{
          title: 'Enabled Books',
          href: null,
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text, // White text
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leader Board',
          href: null,
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.background,
          },
          headerTintColor: theme.text, // White text
        }}
      />
    </Tabs>
  );
}