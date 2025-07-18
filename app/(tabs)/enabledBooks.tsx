import React, { useState, useCallback, useEffect } from 'react';
import { FlatList, Text, View, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import { MIN_CHAPTERS_ENABLED_FOR_SCORE, useBibleBooks } from '@/context/BibleBooksContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BibleBook, Chapter } from '../../types';
import BulkRarityEditor from '../../components/ui/BulkRarityEditor'
import { useThemeContext } from '../../context/ThemeContext';


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
    enabledChapterCount,
    scoreEnabledFlag,
    setScoreEnabledFlag
  } = useBibleBooks();
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [longPressActive, setLongPressActive] = useState(false);
  const { theme } = useThemeContext();
  const [bookGrammar, setBookGrammar] = useState('book');
  const [chapterGrammar, setChapterGrammar] = useState('chapter');
  const totalEnabledBooks = bibleBooks.filter(b => b.enabled).length;

  useEffect(() => {
    if (enabledChapterCount < MIN_CHAPTERS_ENABLED_FOR_SCORE && scoreEnabledFlag) {
      Alert.alert(
        'Score Disabled',
        `Score has been disabled since fewer than ${MIN_CHAPTERS_ENABLED_FOR_SCORE} chapters are enabled.`
      );
      setScoreEnabledFlag(false);
    } else if (enabledChapterCount >= MIN_CHAPTERS_ENABLED_FOR_SCORE && !scoreEnabledFlag) {
      Alert.alert(
        'Score Enabled',
        `Score has been enabled since at least ${MIN_CHAPTERS_ENABLED_FOR_SCORE} chapters are enabled.`
      );
      setScoreEnabledFlag(true);
    }
  }, [enabledChapterCount, scoreEnabledFlag]);

  useEffect(() => {
    if(totalEnabledBooks === 1)
      setBookGrammar('book');
    else
      setBookGrammar('books');
    if(enabledChapterCount === 1)
      setChapterGrammar('chapter');
    else
      setChapterGrammar('chapters')
  }, [enabledChapterCount, totalEnabledBooks]);

  const handlePress = useCallback(async (bookName: string) => {
    // Skip if this was a long press
    if (longPressActive) {
      setLongPressActive(false);
      return;
    }
    
    try {
      await toggleBookEnabled(bookName);
      // Collapse if we just disabled the expanded book
      if (expandedBook === bookName) {
        setExpandedBook(null);
      }
    } catch (err) {
      console.error('Toggle failed:', err);
      Alert.alert('Error', 'Failed to update book status.');
    }
  }, [longPressActive, toggleBookEnabled, expandedBook]);

  const handleLongPress = useCallback((bookName: string) => {
    setLongPressActive(true);
    // Only allow expanding enabled books
    if (bibleBooks.find(b => b.bookName === bookName)?.enabled) {
      setExpandedBook(prev => prev === bookName ? null : bookName);
    }
  }, [bibleBooks]);

  const handleRarityChange = async (
    bookName: string,
    chapterNum: number,
    currentRarity: string
  ) => {
    const currentIndex = rarities.indexOf(currentRarity as any);
    const nextRarity = rarities[(currentIndex + 1) % rarities.length];
    
    try {
      await updateChapterRarity(bookName, chapterNum, nextRarity, true);
      // The true parameter ensures book status gets checked after update
    } catch (err) {
      console.error('Rarity update failed:', err);
      Alert.alert('Error', 'Failed to update chapter rarity');
    }
  };

  const renderChapter = (bookName: string, chapter: Chapter) => (
    <Pressable
      key={chapter.chapter}
      style={styles.chapterItem}
      onPress={() => handleRarityChange(bookName, chapter.chapter, chapter.rarity || 'common')}
    >
      <Text style={[styles.chapterText, {color: theme.text}]}>Chapter {chapter.chapter}</Text>
      <View style={[styles.rarityBadge, styles[`rarity_${chapter.rarity || 'common'}`]]}>
        <Text style={styles.rarityText}>{chapter.rarity === 'ultraRare' ? 'ultra-rare' : (chapter.rarity || 'common')}</Text>
      </View>
    </Pressable>
  );

  const BookItem = React.memo(({ item, isExpanded, onPress, onLongPress, renderChapter }: {
    item: BibleBook;
    isExpanded: boolean;
    onPress: () => void;
    onLongPress: () => void;
    renderChapter: (bookName: string, chapter: Chapter) => JSX.Element;
  }) => {
    return (
      <View style={[styles.bookContainer, {backgroundColor: theme.background + '#000000ff'}]}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={300}
          style={[
            styles.bookItem,
            {backgroundColor: theme.secondary},
            item.enabled ? styles.enabled : styles.disabled,
          ]}
        >
          <Text style={[styles.bookText, {color: theme.text}]}>{item.bookName}</Text>
          <View
            style={[
              styles.statusIndicator,
              item.enabled ? styles.enabledIndicator : styles.disabledIndicator,
            ]}
          />
        </Pressable>

        {isExpanded && item.enabled && item.chapters && (
          <>
            <BulkRarityEditor
              book={{ bookName: item.bookName, chapters: item.chapters }}
              updateChapterRarity={updateChapterRarity}
            />
            <View style={styles.chapterList}>
              {item.chapters.map(ch => renderChapter(item.bookName, ch))}
            </View>
          </>
        )}
      </View>
    );
  });


  const renderItem = useCallback(({ item }: { item: BibleBook }) => {
    const isExpanded = expandedBook === item.bookName;
    
    return (
      <BookItem
        item={item}
        isExpanded={isExpanded}
        onPress={() => handlePress(item.bookName)}
        onLongPress={() => handleLongPress(item.bookName)}
        renderChapter={renderChapter}
      />
    );
  }, [expandedBook, handlePress, handleLongPress, renderChapter]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
        <ActivityIndicator size="large" color="#00e676" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, {borderBottomColor: theme.horizontalDivider}]}>
        <Text style={[styles.subHeaderText, {color: theme.text}]}>
          {totalEnabledBooks} {bookGrammar} enabled — {enabledChapterCount} {chapterGrammar} enabled
        </Text>
      </View>

      <FlatList
        data={bibleBooks}
        renderItem={renderItem}
        keyExtractor={item => item.bookName}
        contentContainerStyle={styles.listContent}
        extraData={{expandedBook, bibleBooks}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  subHeaderText: {
    fontSize: 16,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  bookItem: {
    padding: 12,
    borderRadius: 10,
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