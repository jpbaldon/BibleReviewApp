import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useServices } from '@/context/ServicesContext';
import { useThemeContext } from '@/context/ThemeContext';
import { useTimer } from '@/context/TimerContext';
import { useConfetti } from '@/context/ConfettiContext';
import { useAlert } from '@/context/AlertContext';
import { CompetitiveLeaderboardEntry, CompetitiveScope } from '../../types';
import Icon from 'react-native-vector-icons/Ionicons';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { LeaderboardPodium } from '@/components/LeaderboardPodium';
import { CompetitiveScopeTabs } from '@/components/CompetitiveScopeTabs';
import { CompetitiveTimerCard } from '@/components/CompetitiveTimerCard';
import { clearCompetitiveChampionCache } from '@/hooks/useCompetitiveChampion';
import { COMPETITIVE_SCOPE_LABELS, competitiveDurationLabel } from '@/utils/bibleScope';
import {
  findUserRank,
  splitCompetitiveLeaderboard,
  userRankSubtitle,
  type RankedCompetitiveEntry,
} from '@/utils/competitiveLeaderboard';
import {
  readChampionCelebrated,
  setChampionCelebrated,
} from '@/utils/competitiveChampionCelebration';

export default function CompetitiveLeaderboardScreen() {
  const [scores, setScores] = useState<CompetitiveLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedScope, setSelectedScope] = useState<CompetitiveScope>('full');

  const { user } = useAuth();
  const { theme } = useThemeContext();
  const { competitiveTimer } = useTimer();
  const { showConfetti } = useConfetti();
  const { showToast } = useAlert();
  const server = useServices();

  const { podium, list } = useMemo(() => splitCompetitiveLeaderboard(scores), [scores]);
  const userRank = useMemo(() => findUserRank(scores, user?.id), [scores, user?.id]);
  const rankSubtitle = useMemo(
    () => userRankSubtitle(userRank, COMPETITIVE_SCOPE_LABELS[selectedScope]),
    [userRank, selectedScope],
  );

  useEffect(() => {
    if (competitiveTimer.isActive && competitiveTimer.activeScope) {
      setSelectedScope(competitiveTimer.activeScope);
    }
  }, [competitiveTimer.isActive, competitiveTimer.activeScope]);

  const fetchLeaderboard = useCallback(
    async (scope: CompetitiveScope = selectedScope) => {
      if (!user) return;
      try {
        setRefreshing(true);
        setError(null);
        const data = await server.score.fetchTopCompetitiveScores(scope);
        const rankedData = data.map((item, index) => ({
          ...item,
          rank: index + 1,
        }));
        setScores(rankedData);
        clearCompetitiveChampionCache();
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
    },
    [user, server, selectedScope],
  );

  useFocusEffect(
    useCallback(() => {
      if (user) {
        void fetchLeaderboard(selectedScope);
      }
    }, [user, selectedScope, fetchLeaderboard]),
  );

  useEffect(() => {
    if (loading || refreshing || !user) return;

    let ignore = false;

    const handleChampionCelebration = async () => {
      if (userRank !== 1) {
        await setChampionCelebrated(user.id, selectedScope, false);
        return;
      }

      const celebrated = await readChampionCelebrated(user.id);
      if (ignore || celebrated[selectedScope]) return;

      await setChampionCelebrated(user.id, selectedScope, true);
      if (ignore) return;

      showConfetti({ count: 120 });
      showToast({
        title: 'Champion!',
        message: `You're #1 on the ${COMPETITIVE_SCOPE_LABELS[selectedScope]} board!`,
        variant: 'success',
      });
    };

    void handleChampionCelebration();

    return () => {
      ignore = true;
    };
  }, [loading, refreshing, user, userRank, selectedScope, showConfetti, showToast]);

  const handleScopeChange = (scope: CompetitiveScope) => {
    setSelectedScope(scope);
    setLoading(true);
    void fetchLeaderboard(scope);
  };

  const renderItem = ({ item }: { item: RankedCompetitiveEntry }) => {
    const isCurrentUser = user?.id === item.id;

    return (
      <View
        style={[
          styles.row,
          { borderBottomColor: theme.border },
          isCurrentUser ? { backgroundColor: theme.accentMuted } : null,
        ]}
      >
        <View style={styles.rankCell}>
          <Text style={[styles.rank, { color: theme.textMuted }]}>{item.rank}</Text>
        </View>
        <Text
          style={[
            styles.username,
            { color: isCurrentUser ? theme.warning : theme.text },
            isCurrentUser ? styles.boldUsername : null,
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.username || 'Anonymous'}
        </Text>
        <Text style={[styles.score, { color: theme.competitive }]}>{item.competitive_score}</Text>
      </View>
    );
  };

  const fixedHeader = (
    <>
      <View style={styles.scopeTabs}>
        <CompetitiveScopeTabs
          selectedScope={selectedScope}
          onSelectScope={handleScopeChange}
        />
      </View>

      <CompetitiveTimerCard scope={selectedScope} />

      <View style={[styles.subtitle, { marginTop: 12 }]}>
        <Text style={[styles.subtitleText, { color: theme.textMuted }]}>
          {competitiveDurationLabel(selectedScope)} · {COMPETITIVE_SCOPE_LABELS[selectedScope]} Best Scores
        </Text>
        {rankSubtitle ? (
          <View style={styles.rankBadgeRow}>
            {userRank === 1 ? (
              <Icon name="ribbon" size={16} color={theme.medalGold} />
            ) : null}
            <Badge
              label={rankSubtitle}
              tone={userRank === 1 ? 'gold' : userRank === 2 ? 'silver' : 'bronze'}
            />
          </View>
        ) : null}
      </View>
    </>
  );

  const scrollHeader = (
    <>
      <LeaderboardPodium entries={podium} currentUserId={user?.id} />

      {list.length > 0 ? (
        <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
          <Text style={[styles.headerText, styles.rankHeader, { color: theme.textMuted }]}>
            Rank
          </Text>
          <Text style={[styles.headerText, styles.nameHeader, { color: theme.textMuted }]}>
            Player
          </Text>
          <Text style={[styles.headerText, styles.scoreHeader, { color: theme.textMuted }]}>
            Score
          </Text>
        </View>
      ) : null}
    </>
  );

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
      {fixedHeader}
      <FlatList
        style={styles.list}
        data={list}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={scrollHeader}
        contentContainerStyle={styles.listContent}
        onRefresh={() => fetchLeaderboard(selectedScope)}
        refreshing={refreshing}
        ListEmptyComponent={
          podium.length === 0 ? (
            <AppText variant="muted" style={styles.emptyText}>
              No scores yet. Start a competitive timer and set a personal best!
            </AppText>
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    flex: 1,
  },
  list: {
    flex: 1,
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
  scopeTabs: {
    marginBottom: 4,
  },
  subtitle: {
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  subtitleText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  rankBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  rankHeader: {
    width: 48,
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
    width: 48,
    alignItems: 'center',
  },
  rank: {
    fontWeight: '700',
    fontSize: 14,
  },
  username: {
    flex: 1,
    paddingLeft: 10,
    fontSize: 15,
  },
  boldUsername: {
    fontWeight: '700',
  },
  score: {
    width: 80,
    textAlign: 'right',
    fontWeight: '700',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 12,
    paddingHorizontal: 16,
  },
});
