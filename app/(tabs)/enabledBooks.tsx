import React, { useEffect, useState } from 'react';
import { FlatList, Text, View, StyleSheet, ActivityIndicator, Alert, Pressable, TouchableOpacity } from 'react-native';
import { useBibleBooks, BibleBook, Chapter } from '../../context/BibleBooksContext';
import { SafeAreaView } from 'react-native-safe-area-context';


const rarities: ('common' | 'uncommon' | 'rare' | 'ultraRare' | 'disabled')[] = [
  'common',
  'uncommon',
  'rare',
  'ultraRare',
  'disabled',
];

export default function EnabledBooksScreen() {
  const {
    bibleBooks,
    toggleBookEnabled,
    updateChapterRarity,
    isLoading,
    error,
    refreshBooks,
  } = useBibleBooks();
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

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

  const handleRarityChange = async (
    bookName: string,
    chapterNum: number,
    currentRarity: string
  ) => {
    const currentIndex = rarities.indexOf(currentRarity as any);
    const nextRarity = rarities[(currentIndex + 1) % rarities.length];
    await updateChapterRarity(bookName, chapterNum, nextRarity);
  };

  const renderChapter = (bookName: string, chapter: Chapter) => (
    <Pressable
      key={chapter.Chapter}
      style={styles.chapterItem}
      onPress={() => handleRarityChange(bookName, chapter.Chapter, chapter.rarity || 'common')}
    >
      <Text style={styles.chapterText}>Chapter {chapter.Chapter}</Text>
      <View style={[styles.rarityBadge, styles[`rarity_${chapter.rarity || 'common'}`]]}>
        <Text style={styles.rarityText}>{chapter.rarity === 'ultraRare' ? 'ultra-rare' : (chapter.rarity || 'common')}</Text>
      </View>
    </Pressable>
  );

  const BookItem = React.memo(({ item, expandedBook, setExpandedBook, handleToggle, renderChapter }: {
    item: BibleBook;
    expandedBook: string | null;
    setExpandedBook: (book: string | null) => void;
    handleToggle: (bookName: string) => void;
    renderChapter: (bookName: string, chapter: Chapter) => JSX.Element;
  }) => {
    const isExpanded = expandedBook === item.Book;

    return (
      <View style={styles.bookContainer}>
        <Pressable
          onPress={() => setExpandedBook(isExpanded ? null : item.Book)}
          onLongPress={() => handleToggle(item.Book)}
          style={[
            styles.bookItem,
            item.Enabled ? styles.enabled : styles.disabled,
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

        {isExpanded && item.Enabled && (
          <View style={styles.chapterList}>
            {item.Chapters?.map(ch => renderChapter(item.Book, ch))}
          </View>
        )}
      </View>
    );
  });

  const renderItem = ({ item }: { item: BibleBook }) => (
    <BookItem
      item={item}
      expandedBook={expandedBook}
      setExpandedBook={setExpandedBook}
      handleToggle={handleToggle}
      renderChapter={renderChapter}
    />
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
        contentContainerStyle={styles.listContent}
        extraData={expandedBook}
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
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
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#2e2e2e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  chapterList: {
    marginTop: 6,
    marginLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#444',
    paddingLeft: 10,
  },
  chapterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  chapterText: {
    color: '#ccc',
    fontSize: 14,
  },
  rarityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  rarityText: {
    color: '#fff',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  rarity_common: {
    backgroundColor: '#4caf50',
  },
  rarity_uncommon: {
    backgroundColor: '#2196f3',
  },
  rarity_rare: {
    backgroundColor: '#9c27b0',
  },
  rarity_disabled: {
    backgroundColor: '#9e9e9e',
  },
  rarity_ultraRare: {
    backgroundColor: '#ff9800',
  },
  bookContainer: {
    marginBottom: 10,
  },
});