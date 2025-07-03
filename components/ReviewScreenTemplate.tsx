import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Animated, Vibration, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBibleBooks } from '../context/BibleBooksContext';
import { useScore } from '../context/ScoreContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import { ASV } from '@/data/asv';
import { SimpleBottomSheet } from './SimpleBottomSheet'; // Adjust path if needed
import ConfettiCannon from 'react-native-confetti-cannon'
import { Chapter, DuplicateLocation } from '../types';
import { useThemeContext } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { LongPressButton } from '../components/ui/LongPressButton';
import { MIN_CHAPTERS_ENABLED_FOR_SCORE } from '../context/BibleBooksContext';
import Icon from 'react-native-vector-icons/Ionicons';

interface ContextVerse {
  verseNumber: number;
  text: string;
}

export interface ReviewItem {
  book: string;
  chapter: number;
  text: string;
  context: ContextVerse[];
  duplicateLocations: DuplicateLocation[];
  originalBook?: string;
  originalChapter?: number;
  originalVerseNumber?: number;
  originalDuplicateLocations?: DuplicateLocation[];
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

  const [soundObjects, setSoundObjects] = useState<{
    correct: Audio.Sound | null;
    incorrect: Audio.Sound | null;
  }>({ correct: null, incorrect: null });

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

  useEffect(() => {
    const loadSounds = async () => {
      try {
        const { sound: correctSound } = await Audio.Sound.createAsync(
          require('../assets/sounds/correct.wav')
        );
        const { sound: incorrectSound } = await Audio.Sound.createAsync(
          require('../assets/sounds/incorrect.wav')
        );
        
        setSoundObjects({
          correct: correctSound,
          incorrect: incorrectSound
        });
      } catch (error) {
        console.error('Sound loading error:', error);
      }
    };

    loadSounds();

    return () => {
      // Cleanup function
      soundObjects.correct?.unloadAsync();
      soundObjects.incorrect?.unloadAsync();
    };
  }, []);

  const playFeedbackSound = async (isCorrect: boolean) => {
    try {
      const sound = isCorrect ? soundObjects.correct : soundObjects.incorrect;
      if (sound) {
        await sound.replayAsync(); // More efficient than playAsync for repeated playback
      } else {
        Vibration.vibrate(isCorrect ? 100 : 400);
      }
    } catch (error) {
      console.error('Sound playback error:', error);
      Vibration.vibrate(isCorrect ? 100 : 400);
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

  const loadChapter = (bookName: string, chapterNumber: number, duplicateLocations?: DuplicateLocation[], originalBook?: string, originalChapter?: number, originalVerseNumber?: number, originalDuplicateLocations?: DuplicateLocation[]) => {
    const book = bibleBooks.find(b => b.bookName === bookName);
    const chapter = book?.chapters?.find(c => c.chapter === chapterNumber);
    if(!chapter) return;

    setItem(prevItem => ({
      book: bookName,
      chapter: chapter.chapter,
      text: chapter.summary ?? '',
      context: chapter.verses,
      duplicateLocations: duplicateLocations ?? [],
      originalBook: originalBook ?? prevItem?.originalBook ?? bookName,
      originalChapter: originalChapter ?? prevItem?.originalChapter ?? chapter.chapter,
      originalVerseNumber: originalVerseNumber ?? prevItem?.originalVerseNumber,
      originalDuplicateLocations: originalDuplicateLocations ?? prevItem?.originalDuplicateLocations ?? [],
    }));
    setCurrentChapter(chapter);
    setCurrentBookName(bookName);
    setShowAnswer(true);
    setShowSubmit(false);
  };

  const goToNextChapter = () => {
    if(!currentBookName || !currentChapter) return;
    loadChapter(currentBookName, 
      currentChapter.chapter + 1,
      undefined,
      item?.originalBook,
      item?.originalChapter,
      item?.originalVerseNumber,
      item?.originalDuplicateLocations,
    );
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
          <View style={[styles.verseContainer, { height: verseContainerHeight, backgroundColor: theme.secondary, shadowColor: theme.text }]}>
            <ScrollView contentContainerStyle={{paddingHorizontal: 8}}>{renderQuestion(item, showAnswer)}</ScrollView>
            {showAnswer && currentBookName && currentChapter && (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10}}>
                <TouchableOpacity
                  onPress={currentChapter.chapter === 1 ? () => {} : goToPreviousChapter} // Disable the onPress function when disabled
                  disabled={currentChapter.chapter === 1} // Disable the entire TouchableOpacity when the condition is true
                >
                  <View style={{ flexDirection: 'row', 
                        alignItems: 'center',
                         }}>
                    <Icon
                      name="chevron-back"
                      size={18}
                      style={[
                        currentChapter.chapter === 1 ? [styles.disabledLinkText, { color: theme.disabledLinkText }] : [styles.linkText, { color: theme.linkText }],
                        { marginRight: 2 },
                      ]}
                    />
                    <Text
                      style={[
                        currentChapter.chapter === 1 ? [styles.disabledLinkText, { color: theme.disabledLinkText }] : [styles.linkText, { color: theme.linkText, textDecorationLine: 'underline' }],
                      ]}
                    >
                      Prev
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={goToNextChapter} // Disable the onPress function when disabled
                  disabled={isNextChapterDisabled()} // Disable the entire TouchableOpacity when the condition is true
                >
                  <View style={{ flexDirection: 'row', 
                        alignItems: 'center',
                         }}>
                    <Text
                      style={[
                        isNextChapterDisabled() ? [styles.disabledLinkText, { color: theme.disabledLinkText }] : [styles.linkText, { color: theme.linkText, textDecorationLine: 'underline' }],
                      ]}
                    >
                      Next
                    </Text>
                    <Icon
                      name="chevron-forward"
                      size={18}
                      style={[
                        isNextChapterDisabled() ? [styles.disabledLinkText, { color: theme.disabledLinkText }] : [styles.linkText, { color: theme.linkText }],
                        { marginRight: 2 },
                      ]}
                    />
                  </View>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.loadingText}>Loading...</Text>
        )}

        <View style={styles.inputContainer}>
            <TouchableOpacity 
              style={[styles.dropdown, {backgroundColor: !showAnswer ? theme.secondary : '#A0A0A0', borderColor: !showAnswer ? theme.text : theme.disabledButtonText, shadowColor: theme.text}]}
              disabled={showAnswer} 
              onPress={() => {
                if(showAnswer) {

                }
                else if(enabledBooks.length === 1) {
                  const singleBook = enabledBooks[0];
                  setSelectedBook(singleBook.bookName);
                  setIsSheetVisible(true);
                } else {
                  setIsSheetVisible(true);
                }
              }}
            >
                <Text style={[styles.selectedTextStyle, {color: !showAnswer ? theme.text : theme.disabledButtonText}]}>
                    {selectedBook && selectedChapter ? `${selectedBook} - Chapter ${selectedChapter}` : 'Select Book & Chapter'}
                </Text>
                <Icon name="chevron-down-outline" size={20} color={!showAnswer ? theme.text : theme.disabledButtonText} />
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={[styles.submitButton, (!selectedChapter || showAnswer) && styles.buttonDisabled, {shadowColor: theme.text}]} onPress={checkGuess} disabled={!selectedChapter || showAnswer}>
            <Text style={[styles.submitButtonText, (!selectedChapter || showAnswer) && {color: theme.disabledButtonText}]}>Submit Guess</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.forfeitButton, showAnswer && styles.buttonDisabled, {shadowColor: theme.text}]} onPress={forfeit} disabled={showAnswer}>
            <Text style={[styles.forfeitButtonText, showAnswer && {color: theme.disabledButtonText}]}>Give Up</Text>
          </TouchableOpacity>
        </View>

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
            <TouchableOpacity onPress={loadNewItem} style={[styles.tryAnotherButton, {backgroundColor: theme.neutralButton, shadowColor: theme.text}]}>
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
    borderRadius: 8,
    marginBottom: 20,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dropdown: {
    flex: 1,
    marginHorizontal: 5,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    elevation: 2,
  },
  selectedTextStyle: { fontSize: 16 },
  submitButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  forfeitButton: {
    flex: 1,
    backgroundColor: '#FF0000',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginLeft: 10,
    elevation: 2,
  },
  forfeitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  tryAnotherButton: {
    marginTop: 10,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 2,
  },
  tryAnotherButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  feedbackOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    zIndex: 1000, // ensures it's on top
    backgroundColor: 'rgba(0, 0, 0, 0.75)', // optional dim background
    elevation: 0,
  },

  feedbackText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20,
    borderRadius: 10,
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
    cursor: 'pointer',
  },
  disabledLinkText: {
    fontSize: 18,
    cursor: 'pointer',
  },
  buttonDisabled: {
    backgroundColor: '#A0A0A0',
  },
});