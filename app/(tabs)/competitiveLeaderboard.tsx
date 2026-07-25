import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useServices } from '@/context/ServicesContext';
import { useThemeContext } from '@/context/ThemeContext';
import { CompetitiveLeaderboardEntry } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';

export default function CompetitiveLeaderboardScreen() {
  const [scores, setScores] = useState<CompetitiveLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { user } = useAuth();
  const { theme } = useThemeContext();
  const server = user ? useServices() : null;

  const fetchLeaderboard = async () => {
    if (!server) return;
    try {
      setRefreshing(true);
      setError(null);
      const data = await server.score.fetchTopCompetitiveScores();
      const rankedData = data.map((item, index) => ({
        ...item,
        rank: index + 1,
      }));
      setScores(rankedData);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (server) fetchLeaderboard();
    }, [server]),
  );

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return theme.competitive;
      case 2:
        return theme.textMuted;
      case 3:
        return theme.warning;
      default:
        return theme.text;
    }
  };

  const renderItem = ({ item }: { item: CompetitiveLeaderboardEntry }) => {
    const isCurrentUser = user?.id === item.id;
    const isTopThree = item.rank && item.rank <= 3;

    if (item.competitive_score === 0) return null;

    return (
      <View
        style={[
          styles.row,
          { borderBottomColor: theme.border },
          isTopThree ? styles.topThreeRow : null,
          isCurrentUser ? { backgroundColor: theme.accentMuted } : null,
        ]}
      >
        <View style={[styles.rankContainer, { width: 60 }]}>
          <Icon
            name={isTopThree ? 'medal' : 'trophy'}
            size={24}
            color={getMedalColor(item.rank || 0)}
          />
          <Text
            style={[
              styles.rank,
              { color: getMedalColor(item.rank || 0) },
              isTopThree ? styles.topThreeRank : null,
            ]}
          >
            {item.rank}
          </Text>
        </View>
        <Text
          style={[
            styles.username,
            { flex: 1, paddingLeft: 10, color: theme.text },
            isCurrentUser ? { color: theme.warning, fontWeight: '700' } : null,
            isTopThree ? styles.topThreeName : null,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.username || 'Anonymous'}
        </Text>
        <View style={styles.scoreContainer}>
          <Text
            style={[
              styles.score,
              { color: getMedalColor(item.rank || 0) },
              isTopThree ? styles.topThreeScore : null,
            ]}
          >
            {item.competitive_score}
          </Text>
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <Screen style={styles.centered}>
        <AppText style={styles.centerText}>
          Please sign in to view the Competitive Leaderboard.
        </AppText>
      </Screen>
    );
  }
  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.competitive} />
      </Screen>
    );
  }
  if (error) {
    return (
      <Screen style={styles.centered}>
        <AppText>Error: {error}</AppText>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container} safe={false}>
      <View style={styles.header}>
        <Icon name="trophy" size={28} color={theme.competitive} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Competitive Leaderboard
        </Text>
        <Icon name="trophy" size={28} color={theme.competitive} />
      </View>

      <View style={styles.subtitle}>
        <Text style={[styles.subtitleText, { color: theme.textMuted }]}>
          5-Minute Challenge · Best Scores
        </Text>
      </View>

      <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerText, { width: 60, textAlign: 'center', color: theme.textMuted }]}>
          Rank
        </Text>
        <Text style={[styles.headerText, { flex: 1, paddingLeft: 10, color: theme.textMuted }]}>
          Player
        </Text>
        <Text style={[styles.headerText, { width: 80, textAlign: 'right', color: theme.textMuted }]}>
          Score
        </Text>
      </View>

      <FlatList
        data={scores}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={fetchLeaderboard}
        refreshing={refreshing}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  centerText: {
    textAlign: 'center',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitleText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    marginBottom: 4,
  },
  headerText: {
    fontWeight: '700',
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  topThreeRow: {
    paddingVertical: 16,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rank: {
    fontWeight: '700',
    fontSize: 14,
  },
  topThreeRank: {
    fontSize: 18,
    fontWeight: '700',
  },
  username: {
    fontSize: 15,
  },
  topThreeName: {
    fontSize: 17,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  score: {
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'right',
  },
  topThreeScore: {
    fontSize: 20,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
});
