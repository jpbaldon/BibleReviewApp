import { useTimer } from '../context/TimerContext';
import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';
import { useBibleBooks } from '../context/BibleBooksContext';
import { useScore } from '../context/ScoreContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { SimpleBottomSheet } from './SimpleBottomSheet';
import { VoiceAnswerInput } from './VoiceAnswerInput';
import { useConfetti } from '../context/ConfettiContext';
import { Chapter, DuplicateLocation } from '../types';
import { useThemeContext } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';
import { LongPressButton } from '../components/ui/LongPressButton';
import { isScoreEnabledForBooks } from '../utils/scoreGate';
import { Screen } from './ui/Screen';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import Icon from 'react-native-vector-icons/Ionicons';
import { pointsForAttempt } from '../utils/scoring';
import { filterBooksByScope, competitiveBannerLabel } from '../utils/bibleScope';

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

const correctSound = require('../assets/sounds/correct.wav');
const incorrectSound = require('../assets/sounds/incorrect.wav');

export const ReviewScreenTemplate: React.FC<ReviewScreenTemplateProps> = ({
  title,
  points,
  getRandomItem,
  checkCorrectness,
  renderQuestion,
}) => {
  const { bibleBooks, scoreEnabledFlag } = useBibleBooks();
  const { activeTimer, timedSessionScore, incrementTimedSessionScore, competitiveTimer, competitiveScore, incrementCompetitiveScore } = useTimer();
  const { holdToTryAnother, soundEnabled, micButtonEnabled } = useSettings();
  const { theme } = useThemeContext();

  const [item, setItem] = useState<ReviewItem | null>(null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentBookName, setCurrentBookName] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<number>(0);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedChapter, setSelectedChapter] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  const [showSubmit, setShowSubmit] = useState<boolean>(true);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [feedbackColor, setFeedbackColor] = useState<string>(theme.text);
  const [showFeedback, setShowFeedback] = useState<boolean>(false);
  const [isSheetVisible, setIsSheetVisible] = useState<boolean>(false);
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [voiceInterimTranscript, setVoiceInterimTranscript] = useState<string>('');
  const [enabledBooksCount, setEnabledBooksCount] = useState<number>(bibleBooks.filter(book => book.enabled).length);

  const screenHeight = Dimensions.get('window').height;
  const verseContainerHeight = screenHeight * 0.50;
  const contentContainerHeight = screenHeight * 0.84;
  const { showConfetti } = useConfetti();
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const correctPlayer = useAudioPlayer(correctSound);
  const incorrectPlayer = useAudioPlayer(incorrectSound);

  const {
    overallScore,
    sessionScore,
    incrementOverallScore,
    incrementSessionScore,
    resetSessionScore,
  } = useScore();

  const inTimedSession = activeTimer && activeTimer.isActive;
  const inCompetitiveSession = competitiveTimer && competitiveTimer.isActive;
  const activeCompetitiveScope = competitiveTimer.activeScope;
  const enabledBooks = bibleBooks.filter((book) => book.enabled);
  const allowedBooks =
    inCompetitiveSession && activeCompetitiveScope
      ? filterBooksByScope(bibleBooks, activeCompetitiveScope)
      : enabledBooks;

  const isScoreEnabled = useMemo(
    () => isScoreEnabledForBooks(bibleBooks),
    [bibleBooks],
  );

  useEffect(() => {
    const currentEnabledCount = bibleBooks.filter(book => book.enabled).length;
    if (!inCompetitiveSession) {
      setEnabledBooksCount(currentEnabledCount);
    }
    if (!inCompetitiveSession) {
      loadNewItem();
    }
  }, [bibleBooks, inCompetitiveSession]);

  useEffect(() => {
    if (inCompetitiveSession && activeCompetitiveScope) {
      loadNewItem();
    }
  }, [inCompetitiveSession, activeCompetitiveScope]);

  const playFeedbackSound = (isCorrect: boolean) => {
    if (!soundEnabled) return;

    if (isCorrect) {
      correctPlayer.seekTo(0);
      correctPlayer.play();
    } else {
      incorrectPlayer.seekTo(0);
      incorrectPlayer.play();
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
    if (!chapter) return;

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
    if (!currentBookName || !currentChapter) return;
    loadChapter(
      currentBookName,
      currentChapter.chapter + 1,
      undefined,
      item?.originalBook,
      item?.originalChapter,
      item?.originalVerseNumber,
      item?.originalDuplicateLocations,
    );
  };

  const isNextChapterDisabled = () => {
    if (!currentBookName || !currentChapter) return true;

    const book = bibleBooks.find(b => b.bookName === currentBookName);
    const nextChapterNumber = currentChapter.chapter + 1;
    const nextChapter = book?.chapters?.find(c => c.chapter === nextChapterNumber);

    return !nextChapter;
  };

  const goToPreviousChapter = () => {
    if (!currentBookName || !currentChapter) return;
    loadChapter(currentBookName, currentChapter.chapter - 1);
  };

  const submitGuess = async (guessBook: string, guessChapter: string) => {
    if (!item || !guessChapter) return;
    const isCorrect = checkCorrectness(guessBook, guessChapter, item);

    if (isCorrect) {
      let pointsObtained = 0;
      if (isScoreEnabled || inCompetitiveSession) {
        pointsObtained = pointsForAttempt(points, attempts);
        if (attempts === 0 && pointsObtained > 0) {
          showConfetti();
        }
      }
      incrementSessionScore(pointsObtained);
      incrementOverallScore(pointsObtained);
      if (activeTimer && activeTimer.isActive)
        incrementTimedSessionScore(pointsObtained);
      if (inCompetitiveSession)
        incrementCompetitiveScore(pointsObtained);

      if (pointsObtained > 0)
        setFeedbackText(`Correct! (${pointsObtained} pts)`);
      else
        setFeedbackText(`Correct!`);

    } else {
      triggerShake();
      setFeedbackText('Try again!');
    }

    setFeedbackColor(isCorrect ? theme.success : theme.danger);
    setShowAnswer(isCorrect);
    setShowSubmit(!isCorrect);

    playFeedbackSound(isCorrect);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    await AsyncStorage.setItem('attempts', newAttempts.toString());

    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 1500);
  };

  const checkGuess = () => {
    void submitGuess(selectedBook, selectedChapter);
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

  const booksWithChapters = allowedBooks.map((book) => ({
    label: book.bookName,
    value: book.bookName,
    chapters: (book.chapters || []).map((chapter) => ({
      label: `Chapter ${chapter.chapter}`,
      value: chapter.chapter.toString(),
      rarity: !inCompetitiveSession && chapter.rarity || 'common',
    })),
  }));

  const enabledBookNames = useMemo(
    () => allowedBooks.map((book) => book.bookName),
    [allowedBooks],
  );

  const showTransientFeedback = useCallback((message: string, color: string) => {
    setFeedbackText(message);
    setFeedbackColor(color);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 2000);
  }, []);

  const handleVoiceParsed = useCallback((reference: { book: string; chapter: string }) => {
    setSelectedBook(reference.book);
    setSelectedChapter(reference.chapter);
  }, []);

  const handleVoiceError = useCallback((message: string) => {
    showTransientFeedback(message, theme.danger);
  }, [showTransientFeedback, theme.danger]);

  const handleVoiceListeningChange = useCallback((state: {
    isListening: boolean;
    interimTranscript: string;
  }) => {
    setIsVoiceListening(state.isListening);
    setVoiceInterimTranscript(state.interimTranscript);
  }, []);

  const scoreValueColor = inCompetitiveSession
    ? theme.competitive
    : inTimedSession
      ? theme.danger
      : theme.accent;

  return (
    <Screen style={styles.container}>
      <Animated.View style={[{ flex: 1, transform: [{ translateX: shakeAnim }] }]}>
        <View style={[styles.contentContainer, { height: contentContainerHeight }]}>
          {inTimedSession && (
            <View style={styles.sessionBanner}>
              <Text
                style={[styles.sessionBannerText, { color: theme.danger }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Timer: {activeTimer.name}
              </Text>
              <Text style={[styles.sessionBannerText, { color: theme.danger, marginLeft: 8 }]}>
                - {Math.floor(activeTimer.remaining / 60)}:
                {(activeTimer.remaining % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}
          {inCompetitiveSession && activeCompetitiveScope && (
            <View style={styles.sessionBanner}>
              <Text
                style={[styles.sessionBannerText, { color: theme.competitive }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {competitiveBannerLabel(activeCompetitiveScope)}
              </Text>
              <Text style={[styles.sessionBannerText, { color: theme.competitive, marginLeft: 8 }]}>
                - {Math.floor(competitiveTimer.remaining / 60)}:
                {(competitiveTimer.remaining % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          )}
          <Text style={[styles.title, { color: theme.text }]}>{title}</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreGroup}>
              <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>
                {inCompetitiveSession ? 'Competitive:' : inTimedSession ? 'Timed Session:' : 'Session:'}
              </Text>
              <Text style={[styles.scoreValue, { color: scoreValueColor }]}>
                {inCompetitiveSession ? competitiveScore : inTimedSession ? timedSessionScore : sessionScore}
              </Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: theme.textMuted }]} />
            <View style={styles.scoreGroup}>
              <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>
                {inCompetitiveSession || inTimedSession ? 'Personal Best:' : 'Overall:'}
              </Text>
              <Text style={[styles.scoreValue, { color: scoreValueColor }]}>
                {inCompetitiveSession && activeCompetitiveScope
                  ? competitiveTimer.bestScores[activeCompetitiveScope]
                  : inTimedSession
                    ? activeTimer.bestSessionScore
                    : overallScore}
              </Text>
            </View>
          </View>

          {item ? (
            <Card
              variant="scripture"
              style={[styles.verseContainer, { height: verseContainerHeight }]}
            >
              <ScrollView contentContainerStyle={{ paddingHorizontal: 4 }}>
                {renderQuestion(item, showAnswer)}
              </ScrollView>
              {showAnswer && currentBookName && currentChapter && (
                <View style={styles.navRow}>
                  <TouchableOpacity
                    onPress={currentChapter.chapter === 1 ? undefined : goToPreviousChapter}
                    disabled={currentChapter.chapter === 1}
                  >
                    <View style={styles.navLink}>
                      <Icon
                        name="chevron-back"
                        size={18}
                        color={
                          currentChapter.chapter === 1 ? theme.textDisabled : theme.accent
                        }
                        style={{ marginRight: 2 }}
                      />
                      <Text
                        style={{
                          fontSize: 16,
                          color:
                            currentChapter.chapter === 1 ? theme.textDisabled : theme.accent,
                          textDecorationLine:
                            currentChapter.chapter === 1 ? 'none' : 'underline',
                        }}
                      >
                        Prev
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={goToNextChapter}
                    disabled={isNextChapterDisabled()}
                  >
                    <View style={styles.navLink}>
                      <Text
                        style={{
                          fontSize: 16,
                          color: isNextChapterDisabled()
                            ? theme.textMuted
                            : theme.accent,
                          textDecorationLine: isNextChapterDisabled()
                            ? 'none'
                            : 'underline',
                        }}
                      >
                        Next
                      </Text>
                      <Icon
                        name="chevron-forward"
                        size={18}
                        color={
                          isNextChapterDisabled() ? theme.textDisabled : theme.accent
                        }
                        style={{ marginLeft: 2 }}
                      />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </Card>
          ) : (
            <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading...</Text>
          )}

          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={[
                styles.dropdown,
                {
                  backgroundColor: !showAnswer ? theme.surface : theme.border,
                  borderColor: theme.border,
                  shadowColor: theme.text,
                },
              ]}
              disabled={showAnswer}
              onPress={() => {
                if (showAnswer) {
                  return;
                }
                if (allowedBooks.length === 1) {
                  const singleBook = allowedBooks[0];
                  setSelectedBook(singleBook.bookName);
                  setIsSheetVisible(true);
                } else {
                  setIsSheetVisible(true);
                }
              }}
            >
              <View style={styles.dropdownLeft}>
                <Icon
                  name="book-outline"
                  size={20}
                  color={!showAnswer ? theme.accent : theme.textDisabled}
                  style={styles.dropdownIcon}
                />
                <Text
                  style={[
                    styles.selectedTextStyle,
                    { color: !showAnswer ? theme.text : theme.textDisabled },
                  ]}
                  numberOfLines={1}
                >
                  {isVoiceListening && voiceInterimTranscript
                    ? voiceInterimTranscript
                    : selectedBook && selectedChapter
                      ? `${selectedBook} - Chapter ${selectedChapter}`
                      : isVoiceListening
                        ? 'Listening...'
                        : 'Select Book & Chapter'}
                </Text>
              </View>
              <Icon
                name="chevron-down"
                size={18}
                color={!showAnswer ? theme.textMuted : theme.textDisabled}
              />
            </TouchableOpacity>

            {micButtonEnabled ? (
              <VoiceAnswerInput
                disabled={showAnswer}
                enabledBookNames={enabledBookNames}
                onError={handleVoiceError}
                onListeningChange={handleVoiceListeningChange}
                onParsed={handleVoiceParsed}
              />
            ) : null}

            <SimpleBottomSheet
              visible={isSheetVisible}
              onClose={() => setIsSheetVisible(false)}
              data={booksWithChapters}
              onSelect={(book, chapter) => {
                setSelectedBook(book);
                setSelectedChapter(chapter);
              }}
              title="Select Book"
              submenuTitle="Select Chapter"
              selectedBook={selectedBook}
              selectedChapter={selectedChapter}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              label="Submit Guess"
              variant="success"
              icon="checkmark"
              onPress={checkGuess}
              disabled={!selectedChapter || showAnswer}
              style={styles.flexButton}
            />
            <Button
              label="Give Up"
              variant="danger"
              icon="close"
              onPress={forfeit}
              disabled={showAnswer}
              style={styles.flexButton}
            />
          </View>

          {showFeedback && (
            <View style={[styles.feedbackOverlay, { backgroundColor: theme.background + 'EE' }]}>
              <Text style={[styles.feedbackText, { color: feedbackColor }]}>
                {feedbackText}
              </Text>
            </View>
          )}

          <View style={styles.bottomButtonContainer}>
            {holdToTryAnother ? (
              <LongPressButton onLongPress={loadNewItem} label="Try Another" />
            ) : (
              <Button
                label="Try Another"
                variant="primary"
                icon="refresh"
                onPress={loadNewItem}
                fullWidth
              />
            )}
          </View>
        </View>
      </Animated.View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: { padding: 10 },
  contentContainer: { flex: 1, padding: 0, marginBottom: 0 },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  sessionBanner: {
    alignItems: 'center',
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sessionBannerText: {
    fontSize: 18,
    fontWeight: '700',
    maxWidth: 280,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
    gap: 16,
  },
  scoreGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  scoreLabel: { fontSize: 15 },
  scoreValue: { fontSize: 16, fontWeight: '700' },
  scoreDivider: {
    width: 1.5,
    height: 18,
    alignSelf: 'center',
    borderRadius: 1,
    opacity: 0.7,
  },
  verseContainer: {
    marginBottom: 12,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  navLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 12,
  },
  dropdown: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    elevation: 2,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdownLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  dropdownIcon: {
    marginRight: 10,
  },
  selectedTextStyle: { fontSize: 16, flexShrink: 1 },
  feedbackOverlay: {
    position: 'absolute',
    top: '40%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    zIndex: 1000,
    elevation: 0,
  },
  feedbackText: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    padding: 16,
  },
  loadingText: { textAlign: 'center', marginTop: 20 },
  bottomButtonContainer: { marginTop: 'auto', marginBottom: 0 },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  flexButton: {
    flex: 1,
  },
});
