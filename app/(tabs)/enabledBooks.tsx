import React, { useEffect } from 'react';
import { FlatList, Text, View, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useBibleBooks, BibleBook } from '../../context/BibleBooksContext';
import { useThemeContext } from '../../context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EnabledBooksScreen() {
  const {
    bibleBooks,
    toggleBookEnabled,
    isLoading,
    error,
    refreshBooks,
  } = useBibleBooks();
  const { theme } = useThemeContext();

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        { text: 'OK', onPress: refreshBooks },
      ]);
    }
  }, [error, refreshBooks]);

  const handleToggle = async (bookName: string) => {
    if (!bookName) {
      console.warn('Book name is invalid.');
      return;
    }

    try {
      await toggleBookEnabled(bookName);
    } catch (err) {
      console.error('Toggle failed:', err);
      Alert.alert('Error', 'Failed to update book status.');
    }
  };

  const renderItem = ({ item }: { item: BibleBook }) => (
    <Pressable
      onPress={() => handleToggle(item.Book)}
      style={({ pressed }) => [
        styles.bookItem,
        item.Enabled ? styles.enabled : styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.bookText}>{item.Book}</Text>
      <View
        style={[
          styles.statusIndicator,
          item.Enabled ? styles.enabledIndicator : styles.disabledIndicator,
        ]}
      />
    </Pressable>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#00e676" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.subHeaderText}>
          {bibleBooks.filter(b => b.Enabled).length} books enabled
        </Text>
      </View>

      <FlatList
        data={bibleBooks}
        renderItem={renderItem}
        keyExtractor={item => item.Book}
        numColumns={2}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 16,
    //backgroundColor: '#1c1c1c',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#ccc',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  bookItem: {
    flex: 1, // Allow items to take up equal space in the row
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    margin: 5, // Reduce spacing for better column layout
    borderRadius: 10,
    backgroundColor: '#2e2e2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
  },
  enabled: {
    borderLeftColor: '#00e676',
  },
  disabled: {
    borderLeftColor: '#ff1744',
  },
  pressed: {
    opacity: 0.85,
  },
  bookText: {
    fontSize: 16,
    color: '#eee',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#555',
  },
  enabledIndicator: {
    backgroundColor: '#00e676',
  },
  disabledIndicator: {
    backgroundColor: '#ff1744',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#ccc',
  },
});