import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useScore } from '../../context/ScoreContext';
import { useThemeContext } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LeaderboardEntry } from '../../types'

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
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
      // Proper type checking for errors
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
    }, [])
  );

  const renderItem = ({ item }: { item: LeaderboardEntry }) => {
    console.log(item);
    return (
    <View style={[styles.row, {borderBottomColor: theme.horizontalDivider}]}>
        <Text style={[styles.rank, { width: 60, textAlign: 'center', color: theme.text }]}>
        {item.rank}
        </Text>
        <Text 
        style={[
            { flex: 1, paddingLeft: 10, color: theme.text },
            user?.id === item.id && { color: theme.highlightedText, fontWeight: 'bold' }
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
        >
        {item.username || 'Anonymous'}
        </Text>
        <Text style={[styles.score, { width: 80, textAlign: 'right' }]}>
        {item.overall_score}
        </Text>
    </View>);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.text} />
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
        
        <View style={[styles.headerRow, { borderBottomColor: theme.horizontalDivider }]}>
          <Text style={[styles.headerText, { width: 60, textAlign: 'center', color: theme.text }]}>Rank</Text>
          <Text style={[styles.headerText, { flex: 1, paddingLeft: 10, color: theme.text }]}>User</Text>
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
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 0,
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  rank: {
    fontWeight: 'bold',
  },
  score: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  listContent: {
    paddingBottom: 20,
  },
  
});