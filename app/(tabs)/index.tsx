import { Image, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { useThemeContext } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';

type LinkItem = {
  id: string;
  title: string;
  route: string;
};

export default function HomeScreen() {
  const { theme } = useThemeContext();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const links: LinkItem[] = [
    { id: '1', title: 'About', route: 'about' },
    { id: '2', title: 'Account', route: 'account' },
    { id: '3', title: 'Enabled Books', route: 'enabledBooks' },
    { id: '4', title: 'Leader Board', route: 'leaderboard' },
    { id: '5', title: 'Competitive Leaderboard', route: 'competitiveLeaderboard' },
    { id: '6', title: 'Session Timers', route: 'timers' },
  ];

  const handlePress = (route: string) => {
    navigation.navigate(route as never);
  };

  return (
    <Screen edges={['left', 'right', 'bottom']} style={styles.screen}>
      <View
        style={[
          styles.hero,
          {
            backgroundColor: theme.logoBackground,
            paddingTop: insets.top,
          },
        ]}
      >
        <Image
          source={require('@/assets/images/biblelogo.png')}
          style={styles.bibleLogo}
          resizeMode="contain"
        />
      </View>

      <View style={styles.body}>
        <AppText variant="title" style={styles.title}>
          Bible Review
        </AppText>
        <AppText variant="muted" style={styles.subtitle}>
          Test your knowledge of Scripture
        </AppText>

        <Card padded={false} style={styles.listCard}>
          {links.map((item, index) => (
            <ListRow
              key={item.id}
              title={item.title}
              onPress={() => handlePress(item.route)}
              showDivider={index < links.length - 1}
              style={styles.listRow}
              right={
                <Icon name="chevron-forward" size={22} color={theme.textMuted} />
              }
            />
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 16,
  },
  hero: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bibleLogo: {
    height: 160,
    width: 320,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 20,
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  subtitle: {
    marginBottom: 16,
  },
  listCard: {
    overflow: 'hidden',
  },
  listRow: {
    paddingHorizontal: 14,
  },
});
