import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTimer } from '../../context/TimerContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { TimerInputRow } from '../../components/TimerInputRow';
import { useThemeContext } from '@/context/ThemeContext';
import { useAlert } from '@/context/AlertContext';
import { Screen } from '@/components/ui/Screen';
import { AppText } from '@/components/ui/AppText';
import { CompetitiveScopeTabs } from '@/components/CompetitiveScopeTabs';
import { CompetitiveTimerCard } from '@/components/CompetitiveTimerCard';
import type { CompetitiveScope } from '@/utils/bibleScope';

export default function TimerScreen() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editMinutes, setEditMinutes] = useState<string>('0');
  const [editSeconds, setEditSeconds] = useState<string>('0');
  const [selectedScope, setSelectedScope] = useState<CompetitiveScope>('full');

  const {
    timers,
    competitiveTimer,
    addTimer,
    removeTimer,
    startTimer,
    stopTimer,
    updateTimer,
  } = useTimer();
  const { theme } = useThemeContext();
  const { alert } = useAlert();

  useEffect(() => {
    if (competitiveTimer.isActive && competitiveTimer.activeScope) {
      setSelectedScope(competitiveTimer.activeScope);
    }
  }, [competitiveTimer.isActive, competitiveTimer.activeScope]);

  const handleAdd = (name: string, minutes: number, seconds: number) => {
    const duration = minutes * 60 + seconds;
    if (duration > 0) {
      addTimer(name || 'Unnamed', duration);
    }
  };

  const confirmRemoveTimer = useCallback(
    (timerId: string, timerName: string) => {
      alert(
        'Delete Timer',
        `Delete "${timerName}"? This cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              removeTimer(timerId);
              if (editingId === timerId) {
                setEditingId(null);
              }
            },
          },
        ],
      );
    },
    [alert, removeTimer, editingId],
  );

  return (
    <Screen style={styles.container} safe={false}>
      <View style={[styles.competitiveSection, { borderBottomColor: theme.border }]}>
        <AppText variant="subtitle" style={styles.competitiveTitle}>
          Competitive Timer
        </AppText>
        <CompetitiveScopeTabs
          selectedScope={selectedScope}
          onSelectScope={setSelectedScope}
        />
        <CompetitiveTimerCard scope={selectedScope} />
      </View>

      <AppText variant="subtitle" style={styles.sectionTitle}>
        Session Timers
      </AppText>
      <TimerInputRow onAdd={handleAdd} />
      <FlatList
        data={timers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          return (
            <View style={[styles.timerItem, { borderBottomColor: theme.border }]}>
              {editingId === item.id ? (
                <View style={styles.itemTopRow}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        minWidth: 60,
                      },
                    ]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Name"
                    placeholderTextColor={theme.textDisabled}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        width: 40,
                      },
                    ]}
                    value={editMinutes}
                    onChangeText={setEditMinutes}
                    keyboardType="numeric"
                    placeholder="min"
                    placeholderTextColor={theme.textDisabled}
                  />
                  <Text style={{ color: theme.text }}>:</Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        color: theme.text,
                        borderColor: theme.border,
                        backgroundColor: theme.surface,
                        width: 40,
                      },
                    ]}
                    value={editSeconds}
                    onChangeText={setEditSeconds}
                    keyboardType="numeric"
                    placeholder="sec"
                    placeholderTextColor={theme.textDisabled}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      const min = parseInt(editMinutes) || 0;
                      const sec = parseInt(editSeconds) || 0;
                      const duration = min * 60 + sec;
                      if (duration > 0 && editName.trim()) {
                        updateTimer(item.id, editName.trim(), duration);
                        setEditingId(null);
                      }
                    }}
                  >
                    <Icon name="checkmark" size={28} color={theme.success} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)}>
                    <Icon name="close" size={28} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.itemTopRow}>
                  <Text style={[styles.timerName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.timerTime, { color: theme.text }]}>
                    {`${Math.floor(item.remaining / 60)}:${(item.remaining % 60)
                      .toString()
                      .padStart(2, '0')}`}
                  </Text>
                  <TouchableOpacity onPress={() => startTimer(item.id)} disabled={item.isActive}>
                    <Icon
                      name="play"
                      size={28}
                      color={item.isActive ? theme.textDisabled : theme.accent}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => stopTimer()}>
                    <Icon name="refresh" size={28} color={theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                      setEditMinutes(Math.floor(item.duration / 60).toString());
                      setEditSeconds((item.duration % 60).toString().padStart(2, '0'));
                    }}
                  >
                    <Icon name="pencil" size={24} color={theme.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmRemoveTimer(item.id, item.name)}
                  >
                    <Icon name="trash" size={28} color={theme.danger} />
                  </TouchableOpacity>
                </View>
              )}
              {(item.bestSessionScore ?? 0) > 0 && (
                <View style={styles.itemBottomRow}>
                  <Text style={{ color: theme.text, fontSize: 13 }}>
                    Highest score:{' '}
                    <Text style={{ fontWeight: '700' }}>{item.bestSessionScore}</Text>
                  </Text>
                </View>
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  competitiveSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  competitiveTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginRight: 8,
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
  timerItem: {
    flexDirection: 'column',
    padding: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timerName: { flex: 1, fontSize: 16, fontWeight: '700' },
  timerTime: { width: 60, fontSize: 16, textAlign: 'center' },
  deleteButton: {
    marginLeft: 10,
  },
});
