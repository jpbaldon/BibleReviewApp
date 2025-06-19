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

interface ChapterItem {
  label: string;
  value: string;
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
  selectedBook: string;
  selectedChapter: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

const BookItem = React.memo(({
  item,
  isExpanded,
  isBookSelected,
  onToggleExpand,
  onSelectChapter,
  selectedChapter,
  theme,
}: {
  item: BookItemData;
  isExpanded: boolean;
  isBookSelected: boolean;
  onToggleExpand: (bookValue: string) => void;
  onSelectChapter: (bookValue: string, chapterValue: string) => void;
  selectedChapter: string;
  theme: any;
}) => {
  return (
    <View>
      <TouchableOpacity
        onPress={() => onToggleExpand(item.value)}
        style={[styles.bookItem, {borderBottomColor: theme.horizontalDivider}, isBookSelected && styles.selectedBookItem]}
      >
        <Text style={[styles.bookText, {color: theme.text}, isBookSelected && styles.selectedBookText]}>
          {item.label}
        </Text>
      </TouchableOpacity>
      {isExpanded &&
        item.chapters.map((chapter) => {
          const isChapterSelected = isBookSelected && chapter.value === selectedChapter;
          return (
            <TouchableOpacity
              key={chapter.value}
              onPress={() => onSelectChapter(item.value, chapter.value)}
              style={[styles.chapterItem, {borderBottomColor: theme.horizontalDivider}, isChapterSelected && styles.selectedChapterItem]}
            >
              <Text style={[styles.chapterText, {color: theme.fadedText}, isChapterSelected && styles.selectedChapterText]}>
                {chapter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
});

export const SimpleBottomSheet: React.FC<SimpleBottomSheetProps> = ({
  visible,
  onClose,
  data,
  onSelect,
  title,
  selectedBook,
  selectedChapter,
}) => {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [expandedBook, setExpandedBook] = useState<string>('');
  const { theme } = useThemeContext();

  useEffect(() => {
    if (visible) {
      setExpandedBook(selectedBook);
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
      setExpandedBook(''); // collapse on close
    }
  }, [visible, translateY]);

  const toggleExpand = useCallback((bookValue: string) => {
    setExpandedBook((prev) => (prev === bookValue ? '' : bookValue));
  }, []);

  const handleSelectChapter = useCallback((bookValue: string, chapterValue: string) => {
    onSelect(bookValue, chapterValue);
    onClose();
  }, [onSelect, onClose]);

  const renderItem = useCallback(({ item }: { item: BookItemData }) => {
    return (
      <BookItem
        item={item}
        isExpanded={item.value === expandedBook}
        isBookSelected={item.value === selectedBook}
        onToggleExpand={toggleExpand}
        onSelectChapter={handleSelectChapter}
        selectedChapter={selectedChapter}
        theme={theme}
      />
    );
  }, [expandedBook, selectedBook, selectedChapter, toggleExpand, handleSelectChapter]);

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
        <Text style={[styles.title, {color: theme.text}]}>{title}</Text>
        <FlatList
          data={data}
          keyExtractor={(item) => item.value}
          renderItem={renderItem}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
        />
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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