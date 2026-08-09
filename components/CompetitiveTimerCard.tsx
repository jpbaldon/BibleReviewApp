import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTimer } from '@/context/TimerContext';
import { useThemeContext } from '@/context/ThemeContext';
import { Card } from '@/components/ui/Card';
import { COMPETITIVE_SCOPE_LABELS, competitiveDurationSeconds, type CompetitiveScope } from '@/utils/bibleScope';

interface CompetitiveTimerCardProps {
  scope: CompetitiveScope;
}

export const CompetitiveTimerCard: React.FC<CompetitiveTimerCardProps> = ({ scope }) => {
  const { competitiveTimer, startCompetitiveTimer, stopCompetitiveTimer } = useTimer();
  const { theme } = useThemeContext();

  const label = COMPETITIVE_SCOPE_LABELS[scope];
  const bestScore = competitiveTimer.bestScores[scope];
  const isActive = competitiveTimer.isActive && competitiveTimer.activeScope === scope;
  const anotherScopeActive =
    competitiveTimer.isActive && competitiveTimer.activeScope !== scope;

  const displaySeconds = isActive
    ? competitiveTimer.remaining
    : competitiveDurationSeconds(scope);
  const timeLabel = `${Math.floor(displaySeconds / 60)}:${(displaySeconds % 60)
    .toString()
    .padStart(2, '0')}`;

  return (
    <Card
      style={[
        styles.competitiveTimerItem,
        {
          borderColor: isActive ? theme.competitive : theme.border,
        },
      ]}
    >
      <View style={styles.itemTopRow}>
        <Text style={[styles.timerName, { color: theme.text }]}>{label}</Text>
        <Text
          style={[
            styles.timerTime,
            {
              color: isActive ? theme.competitive : theme.text,
              fontWeight: '700',
              fontSize: 18,
            },
          ]}
        >
          {timeLabel}
        </Text>
        <TouchableOpacity
          onPress={() => startCompetitiveTimer(scope)}
          disabled={anotherScopeActive || isActive}
        >
          <Icon
            name="play"
            size={28}
            color={anotherScopeActive || isActive ? theme.textDisabled : theme.competitive}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => stopCompetitiveTimer()} disabled={!isActive}>
          <Icon
            name="refresh"
            size={28}
            color={isActive ? theme.textMuted : theme.textDisabled}
          />
        </TouchableOpacity>
      </View>
      {bestScore > 0 && (
        <View style={styles.itemBottomRow}>
          <Text style={{ color: theme.text, fontSize: 13 }}>
            Personal Best:{' '}
            <Text style={{ fontWeight: '700', color: theme.competitive }}>{bestScore}</Text>
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  competitiveTimerItem: {
    borderWidth: 2,
  },
  itemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 2,
    paddingTop: 4,
    gap: 6,
  },
  itemBottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 4,
    marginTop: 6,
  },
  timerName: { flex: 1, fontSize: 16, fontWeight: '700' },
  timerTime: { width: 60, fontSize: 16, textAlign: 'center' },
});
