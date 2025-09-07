
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useThemeContext } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface ChapterItem {
  label: string;
  value: string;
  rarity?: string;
}

interface BookItemData {
  label: string;
  value: string;
  chapters: ChapterItem[];
}

interface SimpleBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  data: BookItemData[];
  onSelect: (bookValue: string, chapterValue: string) => void;
  title: string;
  submenuTitle: string;
  selectedBook: string;
  selectedChapter: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export const SimpleBottomSheet: React.FC<SimpleBottomSheetProps> = ({
  visible,
  onClose,
  data,
  onSelect,
  title,
  submenuTitle,
  selectedBook,
  selectedChapter,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [currentBook, setCurrentBook] = useState<BookItemData | null>(null);

  // Helper to abbreviate book names (first 3-4 letters, or custom map)
  const abbreviate = useCallback((label: string) => {
    // Custom abbreviations for common Bible books
    const custom: Record<string, string> = {
      'Genesis': 'Gen', 'Exodus': 'Exo', 'Leviticus': 'Lev', 'Numbers': 'Num', 'Deuteronomy': 'Deut',
      'Joshua': 'Josh', 'Judges': 'Judg', 'Ruth': 'Ruth', '1 Samuel': '1Sa', '2 Samuel': '2Sa',
      '1 Kings': '1Ki', '2 Kings': '2Ki', '1 Chronicles': '1Ch', '2 Chronicles': '2Ch',
      'Ezra': 'Ezr', 'Nehemiah': 'Neh', 'Esther': 'Est', 'Job': 'Job', 'Psalms': 'Ps',
      'Proverbs': 'Prov', 'Ecclesiastes': 'Ecc', 'Song of Solomon': 'Song', 'Isaiah': 'Isa',
      'Jeremiah': 'Jer', 'Lamentations': 'Lam', 'Ezekiel': 'Ezek', 'Daniel': 'Dan',
      'Hosea': 'Hos', 'Joel': 'Joel', 'Amos': 'Amos', 'Obadiah': 'Obad', 'Jonah': 'Jon',
      'Micah': 'Mic', 'Nahum': 'Nah', 'Habakkuk': 'Hab', 'Zephaniah': 'Zeph', 'Haggai': 'Hag',
      'Zechariah': 'Zech', 'Malachi': 'Mal',
      'Matthew': 'Matt', 'Mark': 'Mark', 'Luke': 'Luke', 'John': 'John', 'Acts': 'Acts',
      'Romans': 'Rom', '1 Corinthians': '1Co', '2 Corinthians': '2Co', 'Galatians': 'Gal',
      'Ephesians': 'Eph', 'Philippians': 'Phil', 'Colossians': 'Col', '1 Thessalonians': '1Th',
      '2 Thessalonians': '2Th', '1 Timothy': '1Ti', '2 Timothy': '2Ti', 'Titus': 'Titus',
      'Philemon': 'Phlm', 'Hebrews': 'Heb', 'James': 'Jas', '1 Peter': '1Pe', '2 Peter': '2Pe',
      '1 John': '1Jn', '2 John': '2Jn', '3 John': '3Jn', 'Jude': 'Jude', 'Revelation': 'Rev',
    };
    return custom[label] || label.slice(0, 4);
  }, []);
  const { theme } = useThemeContext();

  useEffect(() => {
    if (visible) {
      if (!selectedBook) {
        setCurrentBook(null);
      }
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
      //setCurrentBook(null);
    }
  }, [visible, translateY, selectedBook]);

  const handleBookSelect = useCallback((book: BookItemData) => {
    setCurrentBook(book);
    if (book.chapters.length === 1) {
      handleSelectChapter(book.value, book.chapters[0].value);
      onClose();
    }
  }, []);

  const handleSelectChapter = useCallback((bookValue: string, chapterValue: string) => {
    onSelect(bookValue, chapterValue);
    onClose();
  }, [onSelect, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View style={[styles.sheetContainer, {backgroundColor: theme.secondary, transform: [{ translateY }] }]}> 
        {!currentBook ? (
          <>
            <Text style={[styles.title, {color: theme.text}]}>{title}</Text>
            <FlatList
              data={data}
              keyExtractor={item => item.value}
              numColumns={5}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={{...styles.gridItem, backgroundColor: theme.background}}
                  onPress={() => handleBookSelect(item)}
                >
                  <Text style={[styles.bookText, {color: theme.text}]}>{abbreviate(item.label)}</Text>
                </TouchableOpacity>
              )}
            />
          </>
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <TouchableOpacity style={styles.backButton} onPress={() => setCurrentBook(null)}>
                <Icon name="arrow-back" size={30} />
              </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}>
                  <Text style={[styles.title, {color: theme.text}]}>{currentBook.label}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>
            <FlatList
              data={currentBook.chapters}
              keyExtractor={item => item.value}
              numColumns={5}
              contentContainerStyle={styles.gridContainer}
              showsVerticalScrollIndicator={true}
              renderItem={({ item }) => {
                // If chapter is disabled, make it unselectable and faded
                const isDisabled = item.rarity === 'disabled';
                return (
                  <TouchableOpacity
                    style={{
                      ...styles.gridItem,
                      backgroundColor: theme.background,
                      opacity: isDisabled ? 0.4 : 1,
                    }}
                    onPress={() => {
                      if (!isDisabled) handleSelectChapter(currentBook.value, item.value);
                    }}
                    disabled={isDisabled}
                  >
                    <Text style={[styles.chapterText, {color: theme.fadedText}]}>{item.label.replace('Chapter ', '')}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  gridItem: {
    paddingVertical: 14,
    paddingHorizontal: 10,
    margin: 6,
    minWidth: 62,
    maxWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginLeft: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  backButtonText: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  backdrop: {
    flex: 1,
    backgroundColor: '#00000088',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  bookItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  selectedBookItem: {
    //backgroundColor: '#4CAF50',
  },
  bookText: {
    fontSize: 16,
  },
  selectedBookText: {
    fontWeight: 'bold',
  },
  chapterItem: {
    paddingVertical: 12,
    paddingLeft: 30,
    borderBottomWidth: 1,
  },
  selectedChapterItem: {
    backgroundColor: '#66bb6a',
  },
  chapterText: {
    fontSize: 15,
  },
  selectedChapterText: {
    fontWeight: 'bold',
    color: '#fff',
  },
});

