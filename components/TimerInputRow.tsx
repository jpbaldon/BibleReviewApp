import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemeContext } from '../context/ThemeContext';

interface TimerInputRowProps {
  onAdd: (name: string, minutes: number, seconds: number) => void;
}

export const TimerInputRow: React.FC<TimerInputRowProps> = ({ onAdd }) => {
  const [name, setName] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [seconds, setSeconds] = useState<string>('');
  const { theme } = useThemeContext();

  const handleAdd = () => {
    const min = parseInt(minutes) || 0;
    const sec = parseInt(seconds) || 0;
    if (min > 0 || sec > 0) {
      onAdd(name || 'Unnamed', min, sec);
      setName('');
      setMinutes('');
      setSeconds('');
    }
  };

  return (
    <View style={styles.inputRow}>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.surface,
          },
        ]}
        placeholder="Timer Name"
        placeholderTextColor={theme.textDisabled}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.surface,
          },
        ]}
        placeholder="Min"
        placeholderTextColor={theme.textDisabled}
        value={minutes}
        onChangeText={setMinutes}
        keyboardType="numeric"
        maxLength={2}
      />
      <Text style={{ fontSize: 18, marginHorizontal: 2, color: theme.text }}>:</Text>
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            borderColor: theme.border,
            backgroundColor: theme.surface,
          },
        ]}
        placeholder="Sec"
        placeholderTextColor={theme.textDisabled}
        value={seconds}
        onChangeText={setSeconds}
        keyboardType="numeric"
        maxLength={2}
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Icon name="add-circle" size={32} color={theme.success} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    marginRight: 4,
    minWidth: 40,
    maxWidth: 100,
    textAlign: 'center',
  },
  addButton: { padding: 4 },
});
