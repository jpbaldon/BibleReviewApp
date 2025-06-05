import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import supabase from '../../supabaseClient'; // Your Supabase client
import { useThemeContext } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

interface LeaderboardEntry {
  id: string;
  username: string;
  overall_score: number;
  rank?: number;
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const { theme } = useThemeContext();
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error: supabaseError } = await supabase
          .from('profiles')
          .select('id, username, overall_score')
          .order('overall_score', { ascending: false })
          .limit(50);

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        const typedData = data as Omit<LeaderboardEntry, 'rank'>[];

        const rankedData = typedData.map((item, index) => ({
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
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  // ... rest of your component remains the same ...
  const renderItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={styles.row}>
        <Text style={[styles.rank, { width: 60, textAlign: 'center' }]}>
        {item.rank}
        </Text>
        <Text 
        style={[
            styles.username, 
            { flex: 1, paddingLeft: 10 },
            user?.id === item.id && { color: 'yellow', fontWeight: 'bold' }
        ]}
        numberOfLines={1}
        ellipsizeMode="tail"
        >
        {item.username || 'Anonymous'}
        </Text>
        <Text style={[styles.score, { width: 80, textAlign: 'right' }]}>
        {item.overall_score}
        </Text>
    </View>
  );

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
        
        <View style={[styles.headerRow, { borderBottomColor: '#FFFFFF' }]}>
          <Text style={[styles.headerText, { width: 60, textAlign: 'center', color: theme.text }]}>Rank</Text>
          <Text style={[styles.headerText, { flex: 1, paddingLeft: 10, color: theme.text }]}>User</Text>
          <Text style={[styles.headerText, { width: 80, textAlign: 'right', color: theme.text }]}>Score</Text>
        </View>

        <FlatList
          data={scores}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
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
    borderBottomColor: '#f0f0f0',
  },
  rank: {
    fontWeight: 'bold',
    color: '#FFF',
  },
  username: {
    color: '#FFF',
  },
  score: {
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  listContent: {
    paddingBottom: 20,
  },
  
});