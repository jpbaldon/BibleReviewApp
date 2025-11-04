import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useServices } from '@/context/ServicesContext';
import { useThemeContext } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompetitiveLeaderboardEntry } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';

export default function CompetitiveLeaderboardScreen() {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const [scores, setScores] = useState<CompetitiveLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
    }, [server])
  );

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700'; // Gold
      case 2: return '#C0C0C0'; // Silver
      case 3: return '#CD7F32'; // Bronze
      default: return theme.text;
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank <= 3) return 'medal';
    return 'trophy';
  };

  const renderItem = ({ item }: { item: CompetitiveLeaderboardEntry }) => {
    const isCurrentUser = user?.id === item.id;
    const isTopThree = item.rank && item.rank <= 3;
    
    return (
      <View 
        style={[
          styles.row, 
          { borderBottomColor: theme.horizontalDivider },
          isTopThree ? styles.topThreeRow : null,
          isCurrentUser ? { backgroundColor: theme.background + '20' } : null
        ]}
      >
        <View style={[styles.rankContainer, { width: 60 }]}>
          <Icon 
            name={getMedalIcon(item.rank || 0)} 
            size={24} 
            color={getMedalColor(item.rank || 0)} 
          />
          <Text 
            style={[
              styles.rank, 
              { color: getMedalColor(item.rank || 0) },
              isTopThree ? styles.topThreeRank : null
            ]}
          >
            {item.rank}
          </Text>
        </View>
        <Text 
          style={[
            styles.username,
            { flex: 1, paddingLeft: 10, color: theme.text },
            isCurrentUser ? { color: theme.highlightedText, fontWeight: 'bold' } : null,
            isTopThree ? styles.topThreeName : null
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
              isTopThree ? styles.topThreeScore : null
            ]}
          >
            {item.competitive_score}
          </Text>
          {isTopThree && (
            <Icon name="star" size={16} color={getMedalColor(item.rank || 0)} style={styles.starIcon} />
          )}
        </View>
      </View>
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: theme.text, fontSize: 18, textAlign: 'center' }}>
            Please sign in to view the Competitive Leaderboard.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <Text style={{ color: theme.text }}>Error: {error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Icon name="trophy" size={32} color="#FFD700" />
        <Text style={[styles.headerTitle, { color: theme.text }]}>Competitive Leaderboard</Text>
        <Icon name="trophy" size={32} color="#FFD700" />
      </View>
      
      <View style={styles.subtitle}>
        <Text style={[styles.subtitleText, { color: theme.text }]}>
          15-Minute Challenge • Best Scores
        </Text>
      </View>

      <View style={[styles.headerRow, { borderBottomColor: theme.horizontalDivider }]}>
        <Text style={[styles.headerText, { width: 60, textAlign: 'center', color: theme.text }]}>Rank</Text>
        <Text style={[styles.headerText, { flex: 1, paddingLeft: 10, color: theme.text }]}>Player</Text>
        <Text style={[styles.headerText, { width: 80, textAlign: 'right', color: theme.text }]}>Score</Text>
      </View>

      <FlatList
        data={scores}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        onRefresh={fetchLeaderboard}
        refreshing={refreshing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  subtitleText: {
    fontSize: 14,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 2,
    marginBottom: 4,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
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
    fontWeight: 'bold',
    fontSize: 14,
  },
  topThreeRank: {
    fontSize: 18,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'right',
  },
  topThreeScore: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  starIcon: {
    marginLeft: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
});
