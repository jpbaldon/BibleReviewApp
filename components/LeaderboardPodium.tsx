import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeContext } from '@/context/ThemeContext';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { getPodiumSlot, type RankedCompetitiveEntry } from '@/utils/competitiveLeaderboard';

interface LeaderboardPodiumProps {
  entries: RankedCompetitiveEntry[];
  currentUserId?: string;
}

type PodiumRank = 1 | 2 | 3;

const PODIUM_ORDER: PodiumRank[] = [2, 1, 3];
const PEDESTAL_HEIGHT: Record<PodiumRank, number> = {
  1: 88,
  2: 64,
  3: 48,
};
/** Approximate #1 card height for top-anchored pulse (avoids FlatList header clipping). */
const FIRST_PLACE_CARD_HEIGHT = 100;

function medalTone(rank: PodiumRank): 'gold' | 'silver' | 'bronze' {
  if (rank === 1) return 'gold';
  if (rank === 2) return 'silver';
  return 'bronze';
}

interface PodiumSlotProps {
  rank: PodiumRank;
  entry: RankedCompetitiveEntry | null;
  isCurrentUser: boolean;
}

function PodiumSlot({ rank, entry, isCurrentUser }: PodiumSlotProps) {
  const { theme } = useThemeContext();
  const pulse = useSharedValue(1);
  const isFirst = rank === 1;

  useEffect(() => {
    if (!isFirst || !entry) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      false,
    );
  }, [isFirst, entry, pulse]);

  const animatedCardStyle = useAnimatedStyle(() => {
    if (!isFirst || !entry) {
      return { transform: [{ scale: 1 }] };
    }

    const scale = pulse.value;
    // Default scale origin is center; nudge down so the top edge stays put while pulsing.
    const translateY = ((scale - 1) * FIRST_PLACE_CARD_HEIGHT) / 2;

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const medalColor =
    rank === 1 ? theme.medalGold : rank === 2 ? theme.medalSilver : theme.medalBronze;

  return (
    <View style={styles.slot}>
      <Animated.View
        style={[
          styles.card,
          animatedCardStyle,
          {
            backgroundColor: isCurrentUser ? theme.accentMuted : theme.surface,
            borderColor: isFirst ? theme.medalGold : theme.border,
            borderWidth: isFirst ? 2 : 1,
          },
        ]}
      >
        {entry ? (
          <>
            {isFirst ? (
              <View style={styles.rankRow}>
                <Badge label={`#${rank}`} tone={medalTone(rank)} />
                <Icon name="ribbon" size={20} color={theme.medalGold} />
              </View>
            ) : (
              <Badge label={`#${rank}`} tone={medalTone(rank)} />
            )}
            <AppText
              variant="body"
              numberOfLines={1}
              style={[styles.username, isCurrentUser && styles.boldUsername]}
              color={isCurrentUser ? theme.warning : theme.text}
            >
              {entry.username || 'Anonymous'}
            </AppText>
            <AppText variant="caption" color={medalColor} style={styles.score}>
              {entry.competitive_score}
            </AppText>
          </>
        ) : (
          <>
            <Badge label={`#${rank}`} tone="neutral" />
            <AppText variant="caption" color={theme.textMuted} style={styles.placeholder}>
              —
            </AppText>
          </>
        )}
      </Animated.View>
      <View
        style={[
          styles.pedestal,
          {
            height: PEDESTAL_HEIGHT[rank],
            backgroundColor: entry ? medalColor + '33' : theme.border,
            borderColor: entry ? medalColor : theme.border,
          },
        ]}
      />
    </View>
  );
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  entries,
  currentUserId,
}) => {
  return (
    <View style={styles.podium}>
      {PODIUM_ORDER.map((rank) => {
        const entry = getPodiumSlot(entries, rank);
        return (
          <PodiumSlot
            key={rank}
            rank={rank}
            entry={entry}
            isCurrentUser={!!entry && entry.id === currentUserId}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 120,
  },
  card: {
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 6,
    minHeight: 96,
    justifyContent: 'center',
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  username: {
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
  },
  boldUsername: {
    fontWeight: '700',
  },
  score: {
    marginTop: 4,
    fontWeight: '700',
    fontSize: 16,
  },
  placeholder: {
    marginTop: 8,
  },
  pedestal: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderWidth: 1,
  },
});
