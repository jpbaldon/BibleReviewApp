import React, { useState, useCallback, useEffect } from 'react';
import { FlatList, Text, View, StyleSheet, ActivityIndicator, Alert, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MIN_CHAPTERS_ENABLED_FOR_SCORE, useBibleBooks } from '@/context/BibleBooksContext';
import { BibleBook, Chapter } from '../../types';
import BulkRarityEditor from '../../components/ui/BulkRarityEditor';
import { Screen } from '@/components/ui/Screen';
import { useThemeContext } from '../../context/ThemeContext';


const rarities: ('common' | 'uncommon' | 'rare' | 'ultraRare' | 'disabled')[] = [
  'common',
  'uncommon',
  'rare',
  'ultraRare',
  'disabled',
];

export default function EnabledBooksScreen() {

  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [longPressActive, setLongPressActive] = useState<boolean>(false);
  const [bulkActionInFlight, setBulkActionInFlight] = useState(false);
  const [bookGrammar, setBookGrammar] = useState<string>('book');
  const [chapterGrammar, setChapterGrammar] = useState<string>('chapter');

  const {
    bibleBooks,
    toggleBookEnabled,
    setAllBooksEnabled,
    invertAllBooksEnabled,
    updateChapterRarity,
    isLoading,
    error,
    enabledChapterCount,
    scoreEnabledFlag,
    setScoreEnabledFlag
  } = useBibleBooks();
  const { theme } = useThemeContext();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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

  const toggleExpanded = useCallback((bookName: string) => {
    if (bibleBooks.find(b => b.bookName === bookName)?.enabled) {
      setExpandedBook(prev => (prev === bookName ? null : bookName));
    }
  }, [bibleBooks]);

  const handleLongPress = useCallback((bookName: string) => {
    setLongPressActive(true);
    toggleExpanded(bookName);
  }, [toggleExpanded]);

  const runBulkBookAction = useCallback(async (
    action: () => Promise<void>,
    errorMessage: string,
  ) => {
    if (bulkActionInFlight) return;
    setBulkActionInFlight(true);
    setExpandedBook(null);
    try {
      await action();
    } catch (err) {
      console.error(errorMessage, err);
      Alert.alert('Error', errorMessage);
    } finally {
      setBulkActionInFlight(false);
    }
  }, [bulkActionInFlight]);

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

  const BookItem = React.memo(({ item, isExpanded, onPress, onLongPress, onExpandToggle, renderChapter }: {
    item: BibleBook;
    isExpanded: boolean;
    onPress: () => void;
    onLongPress: () => void;
    onExpandToggle: () => void;
    renderChapter: (bookName: string, chapter: Chapter) => JSX.Element;
  }) => {
    return (
      <View style={[styles.bookContainer, { backgroundColor: theme.background }]}>
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          delayLongPress={300}
          style={[
            styles.bookItem,
            { backgroundColor: theme.surface, borderColor: theme.border },
            item.enabled ? styles.enabled : styles.disabled,
          ]}
        >
          <Text style={[styles.bookText, { color: theme.text }]}>{item.bookName}</Text>
          <View style={styles.bookRowTrailing}>
            <View
              style={[
                styles.statusIndicator,
                item.enabled
                  ? { backgroundColor: theme.success }
                  : { backgroundColor: theme.textDisabled },
              ]}
            />
            {item.enabled ? (
              <Pressable
                onPress={onExpandToggle}
                hitSlop={10}
                style={styles.chevronButton}
                accessibilityRole="button"
                accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} chapter rarities for ${item.bookName}`}
              >
                <Ionicons
                  name={isExpanded ? 'chevron-down' : 'chevron-forward'}
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>
            ) : (
              <View style={styles.chevronPlaceholder} />
            )}
          </View>
        </Pressable>

        {isExpanded && item.enabled && item.chapters && (
          <>
            <BulkRarityEditor
              book={{ bookName: item.bookName, chapters: item.chapters }}
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
        onExpandToggle={() => toggleExpanded(item.bookName)}
        renderChapter={renderChapter}
      />
    );
  }, [expandedBook, handlePress, handleLongPress, toggleExpanded, renderChapter]);

  if (isLoading) {
    return (
      <Screen style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading books...</Text>
      </Screen>
    );
  }

  return (
    <Screen safe={false} style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: theme.text }]}>Enabled Books</Text>
        <View style={styles.backButton} />
      </View>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.subHeaderText, { color: theme.text }]}>
          {totalEnabledBooks} {bookGrammar} enabled — {enabledChapterCount} {chapterGrammar} enabled
        </Text>
        <View style={styles.bulkBookActions}>
          <Pressable
            onPress={() => runBulkBookAction(
              () => setAllBooksEnabled(true),
              'Failed to enable all books.',
            )}
            disabled={bulkActionInFlight}
            style={({ pressed }) => [
              styles.bulkBookButton,
              { backgroundColor: theme.accent, opacity: bulkActionInFlight ? 0.6 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.bulkBookButtonText, { color: theme.onAccent }]}>Enable all</Text>
          </Pressable>
          <Pressable
            onPress={() => runBulkBookAction(
              () => setAllBooksEnabled(false),
              'Failed to disable all books.',
            )}
            disabled={bulkActionInFlight}
            style={({ pressed }) => [
              styles.bulkBookButton,
              { backgroundColor: theme.accent, opacity: bulkActionInFlight ? 0.6 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.bulkBookButtonText, { color: theme.onAccent }]}>Disable all</Text>
          </Pressable>
          <Pressable
            onPress={() => runBulkBookAction(
              () => invertAllBooksEnabled(),
              'Failed to invert book selection.',
            )}
            disabled={bulkActionInFlight}
            style={({ pressed }) => [
              styles.bulkBookButton,
              { backgroundColor: theme.accent, opacity: bulkActionInFlight ? 0.6 : pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[styles.bulkBookButtonText, { color: theme.onAccent }]}>Invert all</Text>
          </Pressable>
        </View>
        <Text style={[styles.headerHintText, { color: theme.textMuted }]}>
          Tap to enable · Tap › or long-press an enabled book to set chapter rarities
        </Text>
      </View>

      <FlatList
        data={bibleBooks}
        renderItem={renderItem}
        keyExtractor={item => item.bookName}
        contentContainerStyle={styles.listContent}
        extraData={{expandedBook, bibleBooks}}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  subHeaderText: {
    fontSize: 16,
  },
  headerHintText: {
    fontSize: 13,
    marginTop: 10,
    lineHeight: 18,
  },
  bulkBookActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  bulkBookButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulkBookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  bookItem: {
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
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
    borderLeftColor: '#15803D',
  },
  disabled: {
    borderLeftColor: '#DC2626',
  },
  pressed: {
    opacity: 0.85,
  },
  bookText: {
    flex: 1,
    fontSize: 16,
    marginRight: 8,
  },
  bookRowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 28,
  },
  chevronButton: {
    width: 32,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chevronPlaceholder: {
    width: 32,
    height: 28,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  enabledIndicator: {
    backgroundColor: '#15803D',
  },
  disabledIndicator: {
    backgroundColor: '#DC2626',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  chapterList: {
    marginTop: 6,
    marginLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#E7E5E4',
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
    color: '#FAFAF9',
    fontSize: 12,
    textTransform: 'capitalize',
    paddingBottom: 1,
  },
  rarity_common: {
    backgroundColor: '#4CAF50',
  },
  rarity_uncommon: {
    backgroundColor: '#2196F3',
  },
  rarity_rare: {
    backgroundColor: '#9C27B0',
  },
  rarity_disabled: {
    backgroundColor: '#9E9E9E',
  },
  rarity_ultraRare: {
    backgroundColor: '#FF9800',
  },
  bookContainer: {
    marginBottom: 10,
  },
});