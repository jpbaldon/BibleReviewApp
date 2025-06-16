import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, Text, View, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { useBibleBooks } from '../../context/BibleBooksContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BibleBook, Chapter } from '../../types';
import BulkRarityEditor from '../../components/ui/BulkRarityEditor'


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

  const handleToggle = useCallback(async (bookName: string) => {
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
  }, [toggleBookEnabled]);

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
      key={chapter.chapter}
      style={styles.chapterItem}
      onPress={() => handleRarityChange(bookName, chapter.chapter, chapter.rarity || 'common')}
    >
      <Text style={styles.chapterText}>Chapter {chapter.chapter}</Text>
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
  const isExpanded = expandedBook === item.bookName;

    const { chapters } = item;

    return (
      <View style={styles.bookContainer}>
        <Pressable
          onPress={() => handleToggle(item.bookName)}
          onLongPress={() => setExpandedBook(isExpanded ? null : item.bookName)}
          style={[
            styles.bookItem,
            item.enabled ? styles.enabled : styles.disabled,
          ]}
        >
          <Text style={styles.bookText}>{item.bookName}</Text>
          <View
            style={[
              styles.statusIndicator,
              item.enabled ? styles.enabledIndicator : styles.disabledIndicator,
            ]}
          />
        </Pressable>

        {isExpanded && item.enabled && chapters && (
          <>
            <BulkRarityEditor
                book={{ bookName: item.bookName, chapters }}
                updateChapterRarity={updateChapterRarity}
              />
            <View style={styles.chapterList}>
              {item.chapters?.map(ch => renderChapter(item.bookName, ch))}
            </View>
          </>
        )}
      </View>
    );
  });

  const renderItem = useCallback(({ item }: { item: BibleBook }) => (
    <BookItem
      item={item}
      expandedBook={expandedBook}
      setExpandedBook={setExpandedBook}
      handleToggle={handleToggle}
      renderChapter={renderChapter}
    />
  ), [expandedBook, handleToggle]);

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
          {bibleBooks.filter(b => b.enabled).length} books enabled
        </Text>
      </View>

      <FlatList
        data={bibleBooks}
        renderItem={renderItem}
        keyExtractor={item => item.bookName}
        contentContainerStyle={styles.listContent}
        extraData={[expandedBook, bibleBooks]}
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
    flexWrap: 'nowrap',
    overflow: 'visible',
  },
  chapterText: {
    color: '#ccc',
    fontSize: 14,
  },
  rarityBadge: {
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
    flexShrink: 1,
    alignSelf: 'flex-start',
  },
  rarityText: {
    color: '#fff',
    fontSize: 12,
    textTransform: 'capitalize',
    paddingBottom: 1,
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