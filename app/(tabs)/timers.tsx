import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useTimer } from '../../context/TimerContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { TimerInputRow } from '../../components/TimerInputRow';
import { useThemeContext } from '../../context/ThemeContext';

export default function TimerScreen() {
  const { timers, activeTimer, addTimer, removeTimer, startTimer, stopTimer, resetTimer, updateTimer } = useTimer();
  const { theme } = useThemeContext();

  const handleAdd = (name: string, minutes: number, seconds: number) => {
    const duration = minutes * 60 + seconds;
    if (duration > 0) {
      addTimer(name || 'Unnamed', duration);
    }
  };

  return (
    <View style={{...styles.container, backgroundColor: theme.background}}>
      <TimerInputRow onAdd={handleAdd} />
      <FlatList
        data={timers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.timerRow}>
            <Text style={{...styles.timerName, color: theme.text}}>{item.name}</Text>
            <Text style={{...styles.timerTime, color: theme.text}}>
              {`${Math.floor(item.remaining / 60)}:${(item.remaining % 60).toString().padStart(2, '0')}`}
            </Text>
            <TouchableOpacity onPress={() => startTimer(item.id)} disabled={item.isActive}>
              <Icon name="play" size={28} color={item.isActive ? '#aaa' : '#2196F3'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => stopTimer()} disabled={!item.isActive}>
              <Icon name="stop" size={28} color={!item.isActive ? '#aaa' : '#FF9800'} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => resetTimer(item.id)}>
              <Icon name="refresh" size={28} color="#607D8B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeTimer(item.id)}>
              <Icon name="trash" size={28} color="#F44336" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginRight: 8, minWidth: 80 },
  addButton: { padding: 4 },
  timerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  timerName: { flex: 1, fontSize: 16 },
  timerTime: { width: 60, fontSize: 16, textAlign: 'center' },
});
