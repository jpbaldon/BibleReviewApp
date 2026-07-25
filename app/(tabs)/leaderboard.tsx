import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useScore } from '../../context/ScoreContext';
import { useThemeContext } from '@/context/ThemeContext';
import { LeaderboardEntry } from '../../types';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';

export default function LeaderboardScreen() {
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { user } = useAuth();
  const { theme } = useThemeContext();
  const server = useScore();

  const fetchLeaderboard = async () => {
    try {
      setRefreshing(true);
      setError(null);

      const data = await server.fetchLeaderboardFromServer();

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
      fetchLeaderboard();
    }, []),
  );

  const medalTone = (rank?: number) => {
    if (rank === 1) return 'warning' as const;
    if (rank === 2) return 'neutral' as const;
    if (rank === 3) return 'accent' as const;
    return null;
  };

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    const isCurrentUser = user?.id === item.id;
    const tone = medalTone(item.rank);

    return (
      <View
        style={[
          styles.row,
          {
            borderBottomColor: theme.border,
            backgroundColor: isCurrentUser ? theme.accentMuted : 'transparent',
          },
        ]}
      >
        <View style={styles.rankCell}>
          {tone ? (
            <Badge label={`#${item.rank}`} tone={tone} />
          ) : (
            <Text style={[styles.rank, { color: theme.text }]}>{item.rank}</Text>
          )}
        </View>
        <Text
          style={[
            styles.name,
            { color: isCurrentUser ? theme.warning : theme.text },
            isCurrentUser && styles.bold,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.username || 'Anonymous'}
        </Text>
        <Text style={[styles.score, { color: theme.success }]}>
          {item.overall_score}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
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
      <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
        <Text style={[styles.headerText, styles.rankHeader, { color: theme.textMuted }]}>
          Rank
        </Text>
        <Text style={[styles.headerText, styles.nameHeader, { color: theme.textMuted }]}>
          User
        </Text>
        <Text style={[styles.headerText, styles.scoreHeader, { color: theme.textMuted }]}>
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
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    marginBottom: 0,
  },
  headerText: {
    fontWeight: '700',
    fontSize: 14,
  },
  rankHeader: {
    width: 72,
    textAlign: 'center',
  },
  nameHeader: {
    flex: 1,
    paddingLeft: 10,
  },
  scoreHeader: {
    width: 80,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
  },
  rankCell: {
    width: 72,
    alignItems: 'center',
  },
  rank: {
    fontWeight: '700',
  },
  name: {
    flex: 1,
    paddingLeft: 10,
    fontSize: 16,
  },
  bold: {
    fontWeight: '700',
  },
  score: {
    width: 80,
    textAlign: 'right',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 20,
  },
});
