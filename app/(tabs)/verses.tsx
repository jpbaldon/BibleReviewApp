import React, { useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { ReviewScreenTemplate } from '../../components/ReviewScreenTemplate';
import { useBibleBooks } from '../../context/BibleBooksContext';
import { useWeightedChapters, selectWeightedChapter } from '@/utils/randomChapter';
import { isVerseGuessCorrect } from '@/utils/reviewCorrectness';
import { useThemeContext } from '../../context/ThemeContext';

export default function Verses() {
    const { bibleBooks } = useBibleBooks();
  
    const enabledBooks = bibleBooks.filter(b => b.enabled && b.chapters && b.chapters.length > 0);
    const weightedChapters = useWeightedChapters(enabledBooks);
    const { theme } = useThemeContext();

  
    // If no enabled books with chapters, show loading or info
    if (weightedChapters.length === 0) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ marginTop: 10, color: theme.textMuted }}>Waiting for books to be enabled...</Text>
        </View>
      );
    }
  const getRandomVerse = async () => {

    if(weightedChapters.length === 0) throw new Error('No eligible chapters.');

    const { book, chapter, chapterIndex } = selectWeightedChapter(weightedChapters);
    const verse = chapter.verses[Math.floor(Math.random() * chapter.verses.length)];

    return {
      book,
      chapter: chapterIndex,
      verseNumber: verse.verseNumber,
      text: verse.text,
      duplicateLocations: verse.duplicateLocations,
      context: chapter.verses,
    };
  };

  const getRandomItem = async () => {
    const item = await getRandomVerse();
    return {
      ...item,
      originalBook: item.book,
      originalChapter: item.chapter,
      originalVerseNumber: item.verseNumber,
      originalDuplicateLocations: item.duplicateLocations ?? [],
    };
  };

  const checkCorrectness = (book: string, chapter: string, item: any) =>
    isVerseGuessCorrect(book, chapter, item);

  const renderQuestion = (item: any, showAnswer: boolean) => {
    if (showAnswer) {
      const isOriginalChapter = item.book === item.originalBook && item.chapter === item.originalChapter;
      return (
        <View>
          {isOriginalChapter && Array.isArray(item.originalDuplicateLocations) && item.originalDuplicateLocations.length ? (
            <Text style={{color: theme.text}}>The given verse also appears in:</Text>
          ) : null}
          {isOriginalChapter && Array.isArray(item.originalDuplicateLocations) && item.originalDuplicateLocations.map((dl: any, index: number) => (
            <Text
              key={`${dl.Book}-${dl.Chapter}-${dl.Verse}-${index}`}
              style={{color: theme.text, marginBottom: 5}}
            >
              {dl.Book} {dl.Chapter}:{dl.Verse}
            </Text>
          ))}
          <Text style={{ fontWeight: 'bold', fontSize: 22, color: theme.text }}>{item.book} {item.chapter}</Text>
          {item.context.map((v: any) => (
            <Text
              key={v.verseNumber}
              style={{ color: isOriginalChapter && v.verseNumber === item.originalVerseNumber ? theme.highlightedText : theme.text }}
            >
              <Text style={{ fontWeight: 'bold' }}>{v.verseNumber} </Text>
              {v.text}
            </Text>
          ))}
        </View>
      );
    }

    return (
      <Text style={{ fontSize: 18, fontStyle: 'italic', color: theme.text }}>{item.text}</Text>
    );
  };

  return (
    <ReviewScreenTemplate
      title="Verse Review"
      points={10}
      getRandomItem={getRandomItem}
      checkCorrectness={checkCorrectness}
      renderQuestion={(item, showAnswer) => 
        renderQuestion(item, showAnswer)}
    />
  );
}