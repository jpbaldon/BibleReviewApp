import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBibleBooks } from '../context/BibleBooksContext';
import { useScore } from '../context/ScoreContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { ASV } from '@/data/asv';
import { SimpleBottomSheet } from './SimpleBottomSheet'; // Adjust path if needed
import ConfettiCannon from 'react-native-confetti-cannon'
import { Chapter } from '../types';
import { useThemeContext } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { LongPressButton } from '../components/ui/LongPressButton';
import { MIN_CHAPTERS_ENABLED_FOR_SCORE } from '../context/BibleBooksContext';

interface ContextVerse {
  verseNumber: number;
  text: string;
}

export interface ReviewItem {
  book: string;
  chapter: number;
  text: string;
  context: ContextVerse[];
}

interface ReviewScreenTemplateProps {
  title: string;
  points: number;
  getRandomItem: () => Promise<ReviewItem | null>;
  checkCorrectness: (
    selectedBook: string,
    selectedChapter: string,
    item: ReviewItem
  ) => boolean;
  renderQuestion: (item: ReviewItem, showAnswer: boolean) => JSX.Element;
}

export const ReviewScreenTemplate: React.FC<ReviewScreenTemplateProps> = ({
  title,
  points,
  getRandomItem,
  checkCorrectness,
  renderQuestion,
}) => {
  const { bibleBooks, scoreEnabledFlag } = useBibleBooks();
  const [item, setItem] = useState<ReviewItem | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentBookName, setCurrentBookName] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [selectedBook, setSelectedBook] = useState('');
  const [selectedChapter, setSelectedChapter] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSubmit, setShowSubmit] = useState(true);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackColor, setFeedbackColor] = useState('#000000');
  const [showFeedback, setShowFeedback] = useState(false);

  const screenHeight = Dimensions.get('window').height;
  const verseContainerHeight = screenHeight * 0.50;
  const contentContainerHeight = screenHeight * 0.84;
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { holdToTryAnother } = useSettings();
  const { theme } = useThemeContext();

  const {
    overallScore,
    sessionScore,
    incrementOverallScore,
    incrementSessionScore,
    resetSessionScore,
  } = useScore();

  const [enabledBooksCount, setEnabledBooksCount] = useState(
    bibleBooks.filter(book => book.enabled).length
  );

  const isScoreEnabled = useMemo(() => {
    const totalEnabledChapters = bibleBooks.reduce((sum, b) => {
      const chapterCount = b.enabled
        ? (b.chapters?.filter((ch) => ch.rarity !== 'disabled').length ?? 0)
        : 0;
      return sum + chapterCount;
    }, 0);
    return totalEnabledChapters >= MIN_CHAPTERS_ENABLED_FOR_SCORE;
  }, [bibleBooks]);

  const enabledBooks = bibleBooks.filter((book) => book.enabled);

  useEffect(() => {  //a new prompt is loaded any time biblebooks (which includes chapter rarities) is changed
    const currentEnabledCount = bibleBooks.filter(book => book.enabled).length;
    if(currentEnabledCount !== enabledBooksCount) {
        setEnabledBooksCount(currentEnabledCount);
    }
    loadNewItem();
  }, [bibleBooks]);

  const playFeedbackSound = async (isCorrect: boolean) => {
    const soundFile = isCorrect
      ? require('../assets/sounds/correct.wav')
      : require('../assets/sounds/incorrect.wav');

    try {
      const { sound } = await Audio.Sound.createAsync(soundFile);
      await sound.playAsync();
    } catch (error) {
      console.log('Error playing sound', error);
    }
  };

  const loadNewItem = async () => {
    const newItem = await getRandomItem();
    if (newItem) {
      setItem(newItem);
      const book = bibleBooks.find(b => b.bookName === newItem.book);
      const chapter = book?.chapters?.find(c => c.chapter === newItem.chapter);
      setCurrentChapter(chapter ?? null);
      setCurrentBookName(book?.bookName ?? null);
      setAttempts(0);
      setShowAnswer(false);
      setShowSubmit(true);
      await AsyncStorage.setItem('attempts', '0');
      setSelectedBook('');
      setSelectedChapter('');
    }
  };

  const loadChapter = (bookName: string, chapterNumber: number) => {
    const book = bibleBooks.find(b => b.bookName === bookName);
    const chapter = book?.chapters?.find(c => c.chapter === chapterNumber);
    if(!chapter) return;

    setItem({
      book: bookName,
      chapter: chapter.chapter,
      text: chapter.summary ?? '',
      context: chapter.verses,
    });
    setCurrentChapter(chapter);
    setCurrentBookName(bookName);
    setShowAnswer(true);
    setShowSubmit(false);
  };

  const goToNextChapter = () => {
    if(!currentBookName || !currentChapter) return;
    loadChapter(currentBookName, currentChapter.chapter + 1);
  };

  const isNextChapterDisabled = () => {
    if(!currentBookName || !currentChapter) return true;

    const book = bibleBooks.find(b => b.bookName === currentBookName);

    const nextChapterNumber = currentChapter.chapter + 1;
    const nextChapter = book?.chapters?.find(c => c.chapter === nextChapterNumber)

    return !nextChapter;
  };

  const goToPreviousChapter = () => {
    if (!currentBookName || !currentChapter) return;
    loadChapter(currentBookName, currentChapter.chapter - 1);
  };

  const checkGuess = async () => {
    if (!item) return;
    const isCorrect = checkCorrectness(selectedBook, selectedChapter, item);

    if (isCorrect) {
      let pointsObtained = 0;
      if(isScoreEnabled) {
        switch(attempts) {
          case 0:
            console.log('scoreEnabledFlag:', scoreEnabledFlag);
            pointsObtained = points;
            setShowConfetti(true);
            break;
          case 1:
            pointsObtained = points * 0.4;
            break;
          case 2:
            pointsObtained = points * 0.2;
            break;
          default:
            break;
        }
      }
      incrementSessionScore(pointsObtained);
      incrementOverallScore(pointsObtained);

      if(pointsObtained > 0)
        setFeedbackText(`Correct! (${pointsObtained} pts)`);
      else
        setFeedbackText(`Correct!`);

    } else {
      triggerShake();
      setFeedbackText('Try again!');
    }

    setFeedbackColor(isCorrect ? '#00ff00' : '#ff0000');
    setShowAnswer(isCorrect);
    setShowSubmit(!isCorrect);

    await playFeedbackSound(isCorrect);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    await AsyncStorage.setItem('attempts', newAttempts.toString());

    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1500);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const forfeit = () => {
    if (!item) return;
    setShowAnswer(true);
    setShowSubmit(false);
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    loadNewItem();
    resetSessionScore();
  }, []);

  const booksWithChapters = enabledBooks.map((book) => ({
    label: book.bookName,
    value: book.bookName,
    chapters:
        ASV.Bible.find((b) => b.Book === book.bookName)?.Chapters.map((chapter) => ({
        label: `Chapter ${chapter.Chapter}`,
        value: chapter.Chapter.toString(),
        })) || [],
    }));

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.background}]}>
      <Animated.View style={[{ flex: 1, transform: [{translateX: shakeAnim}] }]}>
      <View style={[styles.contentContainer, { height: contentContainerHeight }]}>
        <Text style={[styles.title, {color: theme.text}]}>{title}</Text>

        <View style={styles.scoreRow}>
          <Text style={[styles.scoreText, {color: theme.text}]}>Session:</Text>
          <Text style={[styles.scoreValue, {color: theme.text}]}>{sessionScore}</Text>
          <Text style={[styles.scoreText, {color: theme.text}]}>Overall:</Text>
          <Text style={[styles.scoreValue, {color: theme.text}]}>{overallScore}</Text>
        </View>

        {item ? (
          <View style={[styles.verseContainer, { height: verseContainerHeight, backgroundColor: theme.secondary }]}>
            <ScrollView>{renderQuestion(item, showAnswer)}</ScrollView>
            {showAnswer && currentBookName && currentChapter && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                <TouchableOpacity
                  onPress={currentChapter.chapter === 1 ? () => {} : goToPreviousChapter} // Disable the onPress function when disabled
                  disabled={currentChapter.chapter === 1} // Disable the entire TouchableOpacity when the condition is true
                >
                  <Text
                    style={[
                      currentChapter.chapter === 1 ? [styles.disabledLinkText, {color: theme.disabledLinkText}] : [styles.linkText, {color: theme.linkText}],
                      { marginRight: 5 }
                    ]}
                  >
                    &lt;&lt; Prev
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goToNextChapter} // Disable the onPress function when disabled
                  disabled={isNextChapterDisabled()} // Disable the entire TouchableOpacity when the condition is true
                >
                  <Text
                    style={[
                      isNextChapterDisabled() ? [styles.disabledLinkText, {color: theme.disabledLinkText}] : [styles.linkText, {color: theme.linkText}],
                      { marginRight: 5 }
                    ]}
                  >
                    Next &gt;&gt;
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.loadingText}>Loading...</Text>
        )}

        <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={[styles.dropdown, {backgroundColor: theme.secondary}]} 
              onPress={() => {
                if(enabledBooks.length === 1) {
                  const singleBook = enabledBooks[0];
                  setSelectedBook(singleBook.bookName);
                  setIsSheetVisible(true);
                } else {
                  setIsSheetVisible(true);
                }
              }}
            >
                <Text style={[styles.selectedTextStyle, {color: theme.text}]}>
                    {selectedBook && selectedChapter ? `${selectedBook} - Chapter ${selectedChapter}` : 'Select Book & Chapter'}
                </Text>
            </TouchableOpacity>

            <SimpleBottomSheet
            visible={isSheetVisible}
            onClose={() => setIsSheetVisible(false)}
            data={booksWithChapters}
            onSelect={(book, chapter) => {
                setSelectedBook(book);
                setSelectedChapter(chapter);
            }}
            title="Select Book & Chapter"
            selectedBook={selectedBook}
            selectedChapter={selectedChapter}
            />
        </View>

        {!showAnswer && showSubmit && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={[styles.submitButton, !selectedChapter && styles.submitButtonDisabled]} onPress={checkGuess} disabled={!selectedChapter}>
              <Text style={[styles.submitButtonText, !selectedChapter && {color: theme.disabledButtonText}]}>Submit Guess</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forfeitButton} onPress={forfeit}>
              <Text style={styles.forfeitButtonText}>Give Up</Text>
            </TouchableOpacity>
          </View>
        )}

        {showFeedback && (
          <View style={[styles.feedbackOverlay]}>
            <Text style={[styles.feedbackText, { color: feedbackColor }]}>
              {feedbackText}
            </Text>
          </View>
        )}

        <View style={styles.bottomButtonContainer}>
          {holdToTryAnother ? (
            <LongPressButton onLongPress={loadNewItem} label="Try Another" />
          ) : (
            <TouchableOpacity onPress={loadNewItem} style={[styles.tryAnotherButton, {backgroundColor: theme.neutralButton}]}>
              <Text style={styles.tryAnotherButtonText}>Try Another</Text>
            </TouchableOpacity>
          ) }
        </View>
        
        {showConfetti && (
        <ConfettiCannon
          count={200}
          origin={{ x: -10, y: 0 }}
          fadeOut={true}
          fallSpeed={3000}
          explosionSpeed={350}
        />
      )}
      </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10, backgroundColor: '#1a1a1a' },
  contentContainer: { flex: 1, padding: 0 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreText: { fontSize: 16 },
  scoreValue: { fontSize: 16, fontWeight: 'bold' },
  verseContainer: {
    padding: 10,
    borderRadius: 10,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dropdown: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  selectedTextStyle: { fontSize: 16 },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginRight: 5,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold' },
  forfeitButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 5,
  },
  forfeitButtonText: { color: '#fff', fontWeight: 'bold' },
  tryAnotherButton: {
    marginTop: 10,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  tryAnotherButtonText: { color: '#fff', fontWeight: 'bold' },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // ensures it's on top
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // optional dim background
  },

  feedbackText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    //backgroundColor: '#00000022',
    borderRadius: 10,
    color: '#fff',
  },
  loadingText: { textAlign: 'center', color: '#aaa', marginTop: 20 },
  bottomButtonContainer: { marginTop: 'auto' },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  linkText: {
    fontSize: 18,
    textDecorationLine: 'underline',
    cursor: 'pointer',
  },
    disabledLinkText: {
    fontSize: 18,
    cursor: 'pointer',
  },
  submitButtonDisabled: {
    backgroundColor: '#A0A0A0', // or use `opacity: 0.5` for a faded look
  },
});