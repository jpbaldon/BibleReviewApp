import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useTimer } from '../../context/TimerContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { TimerInputRow } from '../../components/TimerInputRow';
import { useThemeContext } from '@/context/ThemeContext';

export default function TimerScreen() {
  const { timers, activeTimer, addTimer, removeTimer, startTimer, stopTimer, resetTimer, updateTimer } = useTimer();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editMinutes, setEditMinutes] = useState('0');
  const [editSeconds, setEditSeconds] = useState('0');
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
        renderItem={({ item }) => {
          return (
            <View style={{...styles.timerItem, borderBottomColor: theme.horizontalDivider }}>
              {editingId === item.id ? (
                <View style={ styles.itemTopRow }>
                  <TextInput
                    style={[styles.input, { color: theme.text, minWidth: 60 }]}
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Name"
                    placeholderTextColor="#888"
                  />
                  <TextInput
                    style={[styles.input, { color: theme.text, width: 40 }]}
                    value={editMinutes}
                    onChangeText={setEditMinutes}
                    keyboardType="numeric"
                    placeholder="min"
                    placeholderTextColor="#888"
                  />
                  <Text style={{ color: theme.text }}>:</Text>
                  <TextInput
                    style={[styles.input, { color: theme.text, width: 40 }]}
                    value={editSeconds}
                    onChangeText={setEditSeconds}
                    keyboardType="numeric"
                    placeholder="sec"
                    placeholderTextColor="#888"
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
                    <Icon name="checkmark" size={28} color="#4CAF50" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingId(null)}>
                    <Icon name="close" size={28} color="#F44336" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={ styles.itemTopRow }>
                  <Text style={{...styles.timerName, color: theme.text}}>{item.name}</Text>
                  <Text style={{...styles.timerTime, color: theme.text}}>
                    {`${Math.floor(item.remaining / 60)}:${(item.remaining % 60).toString().padStart(2, '0')}`}
                  </Text>
                  <TouchableOpacity onPress={() => startTimer(item.id)} disabled={item.isActive}>
                    <Icon name="play" size={28} color={item.isActive ? '#aaa' : '#2196F3'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => stopTimer()}>
                    <Icon name="refresh" size={28} color="#607D8B" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeTimer(item.id)}>
                    <Icon name="trash" size={28} color="#F44336" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingId(item.id);
                      setEditName(item.name);
                      setEditMinutes(Math.floor(item.duration / 60).toString());
                      setEditSeconds((item.duration % 60).toString().padStart(2, '0'));
                    }}
                  >
                    <Icon name="pencil" size={24} color="#607D8B" />
                  </TouchableOpacity>
                </View>
              )}
              {item.bestSessionScore !== 0 && (
                <View style={ styles.itemBottomRow }>
                  <Text style={{ color: theme.text, fontSize: 13 }}>
                    Highest session score: <Text style={{ fontWeight: 'bold' }}>{item.bestSessionScore}</Text>
                  </Text>
                </View>
              )}
            </View>
          );
        }}
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
  itemTopRow: { flexDirection: 'row', alignItems: 'flex-start', paddingBottom: 2, paddingTop: 4 },
  itemBottomRow: { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 4 },
  timerItem: { flexDirection: 'column', padding: 8, borderBottomWidth: 1 },
  timerName: { flex: 1, fontSize: 16, fontWeight: 'bold' },
  timerTime: { width: 60, fontSize: 16, textAlign: 'center' },
});
